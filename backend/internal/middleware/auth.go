package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const userIDKey ctxKey = "user_id"

// UserID returns the authenticated user's UUID from context, or "" if missing.
func UserID(ctx context.Context) string {
	v, _ := ctx.Value(userIDKey).(string)
	return v
}

// RequireAuth parses and verifies a Supabase HS256 JWT from the Authorization header.
func RequireAuth(secret string, next http.Handler) http.Handler {
	keyFn := func(t *jwt.Token) (any, error) {
		// Supabase signs these tokens with HMAC; reject anything unexpected.
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			http.Error(w, "missing bearer token", http.StatusUnauthorized)
			return
		}
		raw := strings.TrimPrefix(header, "Bearer ")

		// Parse the token and verify it with the Supabase JWT secret.
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(raw, claims, keyFn)
		if err != nil || !token.Valid {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		sub, _ := claims["sub"].(string)
		if sub == "" {
			http.Error(w, "missing sub claim", http.StatusUnauthorized)
			return
		}

		// Store the user id in the request context so handlers can filter data.
		ctx := context.WithValue(r.Context(), userIDKey, sub)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

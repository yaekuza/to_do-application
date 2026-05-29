package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yaekuza/takenhandelaar/backend/internal/middleware"
	"github.com/yaekuza/takenhandelaar/backend/internal/models"
)

func RegisterProfile(mux *http.ServeMux, pool *pgxpool.Pool) {
	mux.HandleFunc("GET /profile", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		var p models.Profile
		err := pool.QueryRow(r.Context(),
			`select id, username, display_name, avatar_url, bio, created_at, updated_at
			 from profiles where id = $1`, uid,
		).Scan(&p.ID, &p.Username, &p.DisplayName, &p.AvatarURL, &p.Bio, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		writeJSON(w, http.StatusOK, p)
	})

	mux.HandleFunc("PUT /profile", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		var in struct {
			Username    *string `json:"username"`
			DisplayName *string `json:"display_name"`
			AvatarURL   *string `json:"avatar_url"`
			Bio         *string `json:"bio"`
		}
		if err := decodeJSON(r, &in); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var p models.Profile
		err := pool.QueryRow(r.Context(),
			`update profiles set
				username     = coalesce($2, username),
				display_name = coalesce($3, display_name),
				avatar_url   = coalesce($4, avatar_url),
				bio          = coalesce($5, bio),
				updated_at   = now()
			 where id = $1
			 returning id, username, display_name, avatar_url, bio, created_at, updated_at`,
			uid, in.Username, in.DisplayName, in.AvatarURL, in.Bio,
		).Scan(&p.ID, &p.Username, &p.DisplayName, &p.AvatarURL, &p.Bio, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		writeJSON(w, http.StatusOK, p)
	})
}

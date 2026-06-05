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
			`insert into profiles (id) values ($1)
			 on conflict (id) do nothing;`, uid,
		).Scan()
		_ = err

		err = pool.QueryRow(r.Context(),
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
			`insert into profiles (id, username, display_name, avatar_url, bio)
			 values ($1, $2, $3, $4, $5)
			 on conflict (id) do update set
				username     = excluded.username,
				display_name = excluded.display_name,
				avatar_url   = excluded.avatar_url,
				bio          = excluded.bio,
				updated_at   = now()
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

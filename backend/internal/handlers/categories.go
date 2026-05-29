package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yaekuza/takenhandelaar/backend/internal/middleware"
	"github.com/yaekuza/takenhandelaar/backend/internal/models"
)

func RegisterCategories(mux *http.ServeMux, pool *pgxpool.Pool) {
	mux.HandleFunc("GET /categories", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		rows, err := pool.Query(r.Context(),
			`select id, user_id, name, color, created_at
			 from categories where user_id = $1 order by name`, uid)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		out := []models.Category{}
		for rows.Next() {
			var c models.Category
			if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Color, &c.CreatedAt); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			out = append(out, c)
		}
		writeJSON(w, http.StatusOK, out)
	})

	mux.HandleFunc("POST /categories", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		var in struct {
			Name  string `json:"name"`
			Color string `json:"color"`
		}
		if err := decodeJSON(r, &in); err != nil || in.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}
		if in.Color == "" {
			in.Color = "#a855f7"
		}
		var c models.Category
		err := pool.QueryRow(r.Context(),
			`insert into categories (user_id, name, color)
			 values ($1, $2, $3)
			 returning id, user_id, name, color, created_at`,
			uid, in.Name, in.Color,
		).Scan(&c.ID, &c.UserID, &c.Name, &c.Color, &c.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusCreated, c)
	})

	mux.HandleFunc("PUT /categories/{id}", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		id := r.PathValue("id")
		var in struct {
			Name  *string `json:"name"`
			Color *string `json:"color"`
		}
		if err := decodeJSON(r, &in); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var c models.Category
		err := pool.QueryRow(r.Context(),
			`update categories set
				name  = coalesce($3, name),
				color = coalesce($4, color)
			 where id = $1 and user_id = $2
			 returning id, user_id, name, color, created_at`,
			id, uid, in.Name, in.Color,
		).Scan(&c.ID, &c.UserID, &c.Name, &c.Color, &c.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		writeJSON(w, http.StatusOK, c)
	})

	mux.HandleFunc("DELETE /categories/{id}", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		id := r.PathValue("id")
		ct, err := pool.Exec(r.Context(),
			`delete from categories where id = $1 and user_id = $2`, id, uid)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if ct.RowsAffected() == 0 {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
}

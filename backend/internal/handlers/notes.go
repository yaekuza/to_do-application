package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yaekuza/takenhandelaar/backend/internal/middleware"
	"github.com/yaekuza/takenhandelaar/backend/internal/models"
)

func RegisterNotes(mux *http.ServeMux, pool *pgxpool.Pool) {
	mux.HandleFunc("GET /notes", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		rows, err := pool.Query(r.Context(),
			`select id, user_id, category_id, title, body, pinned, created_at, updated_at
			 from notes where user_id = $1
			 order by pinned desc, updated_at desc`, uid)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		out := []models.Note{}
		for rows.Next() {
			var n models.Note
			if err := rows.Scan(&n.ID, &n.UserID, &n.CategoryID, &n.Title, &n.Body,
				&n.Pinned, &n.CreatedAt, &n.UpdatedAt); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			out = append(out, n)
		}
		writeJSON(w, http.StatusOK, out)
	})

	mux.HandleFunc("POST /notes", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		var in struct {
			CategoryID *string `json:"category_id"`
			Title      string  `json:"title"`
			Body       string  `json:"body"`
			Pinned     bool    `json:"pinned"`
		}
		if err := decodeJSON(r, &in); err != nil || in.Title == "" {
			http.Error(w, "title is required", http.StatusBadRequest)
			return
		}
		var n models.Note
		err := pool.QueryRow(r.Context(),
			`insert into notes (user_id, category_id, title, body, pinned)
			 values ($1, $2, $3, $4, $5)
			 returning id, user_id, category_id, title, body, pinned, created_at, updated_at`,
			uid, in.CategoryID, in.Title, in.Body, in.Pinned,
		).Scan(&n.ID, &n.UserID, &n.CategoryID, &n.Title, &n.Body,
			&n.Pinned, &n.CreatedAt, &n.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusCreated, n)
	})

	mux.HandleFunc("PUT /notes/{id}", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		id := r.PathValue("id")
		var in struct {
			CategoryID *string `json:"category_id"`
			Title      *string `json:"title"`
			Body       *string `json:"body"`
			Pinned     *bool   `json:"pinned"`
		}
		if err := decodeJSON(r, &in); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var n models.Note
		err := pool.QueryRow(r.Context(),
			`update notes set
				category_id = coalesce($3, category_id),
				title       = coalesce($4, title),
				body        = coalesce($5, body),
				pinned      = coalesce($6, pinned),
				updated_at  = now()
			 where id = $1 and user_id = $2
			 returning id, user_id, category_id, title, body, pinned, created_at, updated_at`,
			id, uid, in.CategoryID, in.Title, in.Body, in.Pinned,
		).Scan(&n.ID, &n.UserID, &n.CategoryID, &n.Title, &n.Body,
			&n.Pinned, &n.CreatedAt, &n.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		writeJSON(w, http.StatusOK, n)
	})

	mux.HandleFunc("DELETE /notes/{id}", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		id := r.PathValue("id")
		ct, err := pool.Exec(r.Context(),
			`delete from notes where id = $1 and user_id = $2`, id, uid)
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

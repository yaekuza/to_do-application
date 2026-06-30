package handlers

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yaekuza/takenhandelaar/backend/internal/middleware"
	"github.com/yaekuza/takenhandelaar/backend/internal/models"
)

// RegisterTasks adds CRUD routes for the student's planned tasks.
func RegisterTasks(mux *http.ServeMux, pool *pgxpool.Pool) {
	mux.HandleFunc("GET /tasks", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())

		// Optional from/to query parameters let the calendar request one week at a time.
		var (
			from, to *time.Time
		)
		if v := r.URL.Query().Get("from"); v != "" {
			t, err := time.Parse(time.RFC3339, v)
			if err == nil {
				from = &t
			}
		}
		if v := r.URL.Query().Get("to"); v != "" {
			t, err := time.Parse(time.RFC3339, v)
			if err == nil {
				to = &t
			}
		}

		// coalesce chooses the best date to filter/order by: start time, deadline, or created date.
		rows, err := pool.Query(r.Context(),
			`select id, user_id, category_id, title, description,
				start_time, end_time, deadline, priority, status, created_at
			 from tasks
			 where user_id = $1
			   and ($2::timestamptz is null or coalesce(start_time, deadline) >= $2)
			   and ($3::timestamptz is null or coalesce(start_time, deadline) <  $3)
			 order by coalesce(start_time, deadline, created_at)`,
			uid, from, to)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		out := []models.Task{}
		for rows.Next() {
			var t models.Task
			if err := rows.Scan(&t.ID, &t.UserID, &t.CategoryID, &t.Title, &t.Description,
				&t.StartTime, &t.EndTime, &t.Deadline, &t.Priority, &t.Status, &t.CreatedAt); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			out = append(out, t)
		}
		writeJSON(w, http.StatusOK, out)
	})

	mux.HandleFunc("POST /tasks", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		var in struct {
			CategoryID  *string    `json:"category_id"`
			Title       string     `json:"title"`
			Description *string    `json:"description"`
			StartTime   *time.Time `json:"start_time"`
			EndTime     *time.Time `json:"end_time"`
			Deadline    *time.Time `json:"deadline"`
			Priority    string     `json:"priority"`
			Status      string     `json:"status"`
		}
		if err := decodeJSON(r, &in); err != nil || in.Title == "" {
			http.Error(w, "title is required", http.StatusBadRequest)
			return
		}
		if in.Priority == "" {
			in.Priority = "medium"
		}
		if in.Status == "" {
			in.Status = "open"
		}

		// The authenticated user id comes from the JWT, not from the browser body.
		var t models.Task
		err := pool.QueryRow(r.Context(),
			`insert into tasks (user_id, category_id, title, description, start_time, end_time, deadline, priority, status)
			 values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			 returning id, user_id, category_id, title, description,
				start_time, end_time, deadline, priority, status, created_at`,
			uid, in.CategoryID, in.Title, in.Description,
			in.StartTime, in.EndTime, in.Deadline, in.Priority, in.Status,
		).Scan(&t.ID, &t.UserID, &t.CategoryID, &t.Title, &t.Description,
			&t.StartTime, &t.EndTime, &t.Deadline, &t.Priority, &t.Status, &t.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		writeJSON(w, http.StatusCreated, t)
	})

	mux.HandleFunc("PUT /tasks/{id}", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		id := r.PathValue("id")
		var in struct {
			CategoryID  *string    `json:"category_id"`
			Title       *string    `json:"title"`
			Description *string    `json:"description"`
			StartTime   *time.Time `json:"start_time"`
			EndTime     *time.Time `json:"end_time"`
			Deadline    *time.Time `json:"deadline"`
			Priority    *string    `json:"priority"`
			Status      *string    `json:"status"`
		}
		if err := decodeJSON(r, &in); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var t models.Task
		// coalesce keeps old values when optional fields are not included in the request.
		err := pool.QueryRow(r.Context(),
			`update tasks set
				category_id = $3,
				title       = coalesce($4, title),
				description = $5,
				start_time  = $6,
				end_time    = $7,
				deadline    = $8,
				priority    = coalesce($9, priority),
				status      = coalesce($10, status)
			 where id = $1 and user_id = $2
			 returning id, user_id, category_id, title, description,
				start_time, end_time, deadline, priority, status, created_at`,
			id, uid, in.CategoryID, in.Title, in.Description,
			in.StartTime, in.EndTime, in.Deadline, in.Priority, in.Status,
		).Scan(&t.ID, &t.UserID, &t.CategoryID, &t.Title, &t.Description,
			&t.StartTime, &t.EndTime, &t.Deadline, &t.Priority, &t.Status, &t.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		writeJSON(w, http.StatusOK, t)
	})

	mux.HandleFunc("DELETE /tasks/{id}", func(w http.ResponseWriter, r *http.Request) {
		uid := middleware.UserID(r.Context())
		id := r.PathValue("id")
		// Delete only succeeds when the task belongs to the logged-in user.
		ct, err := pool.Exec(r.Context(),
			`delete from tasks where id = $1 and user_id = $2`, id, uid)
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

package models

import "time"

type Profile struct {
	ID          string    `json:"id"`
	Username    *string   `json:"username"`
	DisplayName *string   `json:"display_name"`
	AvatarURL   *string   `json:"avatar_url"`
	Bio         *string   `json:"bio"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Category struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

type Task struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	CategoryID  *string    `json:"category_id"`
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Deadline    *time.Time `json:"deadline"`
	Priority    string     `json:"priority"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Note struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	CategoryID *string   `json:"category_id"`
	Title      string    `json:"title"`
	Body       string    `json:"body"`
	Pinned     bool      `json:"pinned"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

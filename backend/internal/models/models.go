package models

import "time"

// Profile is the public user information shown on the profile page.
type Profile struct {
	ID          string    `json:"id"`
	Username    *string   `json:"username"`
	DisplayName *string   `json:"display_name"`
	AvatarURL   *string   `json:"avatar_url"`
	Bio         *string   `json:"bio"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Category groups tasks/notes for one signed-in user.
type Category struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

// Task is the main planning item in the calendar and dashboard.
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

// Note stores extra study notes or reminders for the user.
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

package config

import (
	"errors"
	"os"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	FrontendOrigin string
	Port           string
}

// Load reads the backend settings from environment variables.
// This keeps secrets like the database URL and JWT secret out of the code.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		JWTSecret:      os.Getenv("SUPABASE_JWT_SECRET"),
		FrontendOrigin: os.Getenv("FRONTEND_ORIGIN"),
		Port:           os.Getenv("PORT"),
	}
	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, errors.New("SUPABASE_JWT_SECRET is required")
	}
	// Local defaults make development easier when these env vars are not set.
	if cfg.FrontendOrigin == "" {
		cfg.FrontendOrigin = "http://localhost:5173"
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	return cfg, nil
}

package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/yaekuza/takenhandelaar/backend/internal/config"
	"github.com/yaekuza/takenhandelaar/backend/internal/db"
	"github.com/yaekuza/takenhandelaar/backend/internal/handlers"
	"github.com/yaekuza/takenhandelaar/backend/internal/middleware"
)

func main() {
	// Load local environment variables during development; production can provide real env vars.
	_ = godotenv.Load()

	// Read required settings before starting the server.
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	// Open one shared database pool that all route handlers reuse.
	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	// Health endpoint is useful for deployment checks and quick local testing.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// API routes are registered on their own mux so auth can wrap all /api requests at once.
	api := http.NewServeMux()
	handlers.RegisterProfile(api, pool)
	handlers.RegisterCategories(api, pool)
	handlers.RegisterTasks(api, pool)
	handlers.RegisterNotes(api, pool)

	// Every /api route needs a valid Supabase token before it reaches handlers.
	authed := middleware.RequireAuth(cfg.JWTSecret, api)
	mux.Handle("/api/", http.StripPrefix("/api", authed))

	// CORS lets the browser-based React app call the Go API.
	handler := middleware.CORS(cfg.FrontendOrigin, mux)

	// ReadHeaderTimeout prevents slow-client connections from hanging forever.
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	// Run the server in a goroutine so main can keep listening for shutdown signals.
	go func() {
		log.Printf("listening on :%s (cors origin %s)", cfg.Port, cfg.FrontendOrigin)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("http: %v", err)
		}
	}()

	// Wait for Ctrl+C or a server stop signal, then shut down gracefully.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	// Give active requests a short window to finish before the process exits.
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

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
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	api := http.NewServeMux()
	handlers.RegisterProfile(api, pool)
	handlers.RegisterCategories(api, pool)
	handlers.RegisterTasks(api, pool)
	handlers.RegisterNotes(api, pool)

	authed := middleware.RequireAuth(cfg.JWTSecret, api)
	mux.Handle("/api/", http.StripPrefix("/api", authed))

	handler := middleware.CORS(cfg.FrontendOrigin, mux)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s (cors origin %s)", cfg.Port, cfg.FrontendOrigin)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("http: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

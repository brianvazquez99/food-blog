package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

func main() {
	r := gin.Default()

		db, err := sql.Open("sqlite", "./blog.db")

	defer db.Close()



	if err := db.Ping(); err != nil {
		panic(err)
	}

	if err != nil {
		log.Fatal(err)
	}

		ctx := context.Background()

		    api := r.Group("/api")
    {
        api.POST("/postBlog", uploadBlog(ctx, db))
        api.GET("/getBlogs", getBlogs(ctx, db))
    }

	// r.POST("api/postBlog", uploadBlog(ctx, db))
	// r.GET("api/getBlogs", getBlogs(ctx, db))

	// r.Static("/", "front-end\\dist\\front-end\\browser")



  r.StaticFS("/app", gin.Dir("front-end/dist/front-end/browser", false))




	r.NoRoute(func(g *gin.Context) {
		if !strings.HasPrefix(g.Request.URL.Path, "/api/") {
			g.File("front-end\\dist\\front-end\\browser\\index.html")
		} else {
			g.JSON(http.StatusNotFound, gin.H{"message": "No Content"})
		}
	})


	r.Run(":8080")
}

func getBlogs(c context.Context, db *sql.DB) gin.HandlerFunc {
	return func(g *gin.Context) {
		type BLOG struct {
			TITLE        string
			BODY         string
			ID           int
			DATE_ADDED   *string
			DATE_UPDATED *string
		}

		var blogs []BLOG

		var query string = `SELECT TITLE, BODY, ID, DATE_ADDED, DATE_UPDATED
							FROM BLOG_POSTS`

		rows, err := db.Query(query)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "Error fetching blogs!"})
			return
		}

		defer rows.Close()

		for rows.Next() {
			var blog BLOG

			err = rows.Scan(&blog.TITLE, &blog.BODY, &blog.ID, &blog.DATE_ADDED, &blog.DATE_UPDATED)

			if err != nil {
				g.JSON(http.StatusInternalServerError, gin.H{"message": "Error scanning rows!"})
				return
			}

			blogs = append(blogs, blog)
		}

		g.JSON(http.StatusOK, blogs)

	}
}

func uploadBlog(c context.Context, db *sql.DB) gin.HandlerFunc {

	return func(g *gin.Context) {
		type BLOG_POST struct {
			TITLE string
			BODY  string
		}

		var post BLOG_POST

		err := g.ShouldBindJSON(&post)

		if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "Incorrect format to post blog!"})
			return
		}

		query := `INSERT INTO BLOG_POSTS (TITLE, BODY, DATE_ADDED)
	 			VALUES (?,?, date('now'))`

		result, err := db.Exec(query, post.TITLE, post.BODY)

		if err != nil {
			println(err.Error())
			g.JSON(http.StatusInternalServerError, gin.H{"message": err})
			return
		}

		id, err := result.LastInsertId()

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured trying to get the id"})
			return

		}

		g.JSON(http.StatusOK, gin.H{"ID": id})

	}

}

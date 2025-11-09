package main

import (
	"context"
	"database/sql"
	"html/template"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
  "github.com/gin-contrib/gzip"
	"github.com/dgraph-io/ristretto/v2"
	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

		type BLOG struct {
			TITLE        string
			BODY         template.HTML
			ID           int
			DATE_ADDED   *string
			DATE_UPDATED *string
		}

		var cache *ristretto.Cache[string, any]


		func main() {
			r := gin.Default()

			r.Use(gzip.Gzip(gzip.DefaultCompression))

			db, err := sql.Open("sqlite", "./blog.db")

			defer db.Close()


			cache, err = ristretto.NewCache(&ristretto.Config[string, any]{
				NumCounters: 10,
				MaxCost: 1 << 27,
				BufferItems: 64,
			})



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
        api.GET("/getThumbnail/:id", getThumbnail(ctx, db))
        api.GET("/getBlogDetails/:slug", getBlogDetails(ctx, db))
        api.GET("/searchBlogs", searchBlogs(ctx, db))
    }

	// r.POST("api/postBlog", uploadBlog(ctx, db))
	// r.GET("api/getBlogs", getBlogs(ctx, db))

	// r.Static("/", "front-end\\dist\\front-end\\browser")

	r.LoadHTMLGlob("templates/*.html")



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

		recent := g.Query("recent")


		var blogs []BLOG

		var query string

		if recent != "" {

				 query  = `SELECT TITLE, BODY, ID, DATE_ADDED, DATE_UPDATED
								FROM BLOG_POSTS
								ORDER BY DATE_ADDED DESC
								LIMIT 5`

		}else {

			 query  = `SELECT TITLE, BODY, ID, DATE_ADDED, DATE_UPDATED
								FROM BLOG_POSTS`
		}


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

func getThumbnail(c context.Context, db *sql.DB) gin.HandlerFunc {
	return func (g *gin.Context) {
		id := g.Param("id")

		var thumbNail []byte

		cachedThumbnail, found := cache.Get(id + "-thumbnail")

		if (found) {
  g.Data(http.StatusOK, "image/jpeg",  cachedThumbnail.([]byte) )

		}

		query := `SELECT THUMBNAIL
				FROM BLOG_POSTS
				WHERE ID = ?`

		row := db.QueryRow(query, id)

		err := row.Scan(&thumbNail)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "error getting thumbnail"})
		}


  g.Header("Content-Type", "image/jpeg")
	g.Header("Content-Disposition", "inline; filename=image.jpg")

  g.Data(http.StatusOK, "image/jpeg", thumbNail)

}
}


func getBlogDetails(c context.Context, db *sql.DB) gin.HandlerFunc {
			re := regexp.MustCompile(`(?i)background-color\s*:\s*[^;"]+;?`)

	return func (g *gin.Context) {
		var blog BLOG

		slug := g.Param("slug")

		cachedBlog, found := cache.Get(slug)

		if (found) {
					g.HTML(http.StatusOK, "blog_detail.html", cachedBlog)
		}else {
cleanedSlug := strings.ReplaceAll(slug, "-", "")

		query := `SELECT ID, TITLE, BODY, DATE_ADDED
				FROM BLOG_POSTS
				WHERE LOWER(REPLACE(TITLE, ' ', '')) = ?`

		row := db.QueryRow(query,cleanedSlug)

		var rawBody string;

		err := row.Scan(&blog.ID, &blog.TITLE, &rawBody, &blog.DATE_ADDED)

		cleaned := re.ReplaceAllString(rawBody, "")

		blog.BODY = template.HTML(cleaned)

		cache.SetWithTTL(slug, &blog, int64(len(blog.BODY)), 10 * time.Minute)

		cache.Wait()

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message" : "Failed to scan row"})
			return
		}

		g.HTML(http.StatusOK, "blog_detail.html", blog)

		}


		// g.JSON(http.StatusOK, blog)


	}
}

func uploadBlog(c context.Context, db *sql.DB) gin.HandlerFunc {

	return func(g *gin.Context) {
		type BLOG_POST struct {
			TITLE string
			BODY  string
		}

		var post BLOG_POST

		err := g.ShouldBind(&post)

		if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "Incorrect format to post blog!"})
			return
		}

		thumbNail, err := g.FormFile("THUMBNAIL")

		if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "Unable to bind thumbnail"})
			return
		}

		f, err := thumbNail.Open()

			if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "Unable to open thumbnail"})
			return
		}

		defer f.Close()

		bytes, err := io.ReadAll(f)

		if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "Unable to read all thumbnail"})
			return
		}




		query := `INSERT INTO BLOG_POSTS (TITLE, BODY, DATE_ADDED, THUMBNAIL)
	 			VALUES (?,?, date('now'), ?)`

		result, err := db.Exec(query, post.TITLE, post.BODY, bytes)

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


func searchBlogs(c context.Context, db *sql.DB) gin.HandlerFunc {

	type BLOG_SEARCH struct {
		ID int
		TITLE string
	}

	return func (g *gin.Context) {

		var searchResults []BLOG_SEARCH

		searchTerm := "%" + g.Query("search") + "%"

		query := `SELECT ID, TITLE
				from BLOG_POSTS
				WHERE TITLE LIKE ?`

		rows, err := db.Query(query, searchTerm)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to fetch search"})
		}

		defer rows.Close()

		for rows.Next() {
			var blog BLOG_SEARCH

			err := rows.Scan(&blog.ID, &blog.TITLE)

			if err != nil {
				g.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to scan item after search"})
			}

			searchResults = append(searchResults, blog)

	}

	g.JSON(http.StatusOK, searchResults)


	}
}

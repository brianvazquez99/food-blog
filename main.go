package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"html/template"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/dgraph-io/ristretto/v2"
	"github.com/didip/tollbooth/v7"
	"github.com/didip/tollbooth/v7/limiter"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"

	// "github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

		type BLOG struct {
			TITLE        string
			BODY         template.HTML
			CATEGORY 	*[]string
			ID           int
			DATE_ADDED   *string
			DATE_UPDATED *string
		}

		var cache *ristretto.Cache[string, any]


		func main() {
				mime.AddExtensionType(".wasm", "application/wasm",)
			mime.AddExtensionType(".js", "text/javascript")
			r := gin.Default()



			// database_url := os.Getenv("DATABASE_URL")

			// config, err := pgxpool.ParseConfig(database_url)

				db, err := sql.Open("sqlite", "./blog.db")

				defer db.Close()

			if err != nil {
				log.Fatal(err)
			}

			// db, err := pgxpool.NewWithConfig(context.Background(), config)
			// 	if err != nil {
			// 	log.Fatal(err)
			// }

			// blogQuery := `CREATE TABLE IF NOT EXISTS BLOG_POSTS (
			// 			ID BIGSERIAL PRIMARY KEY,
			// 			TITLE TEXT,
			// 			BODY TEXT,
			// 			THUMBNAIL BYTEA,
			// 			SERVINGS TEXT,
			// 			PREP TIME TEXT,
			// 			COOK TIME TEXT,
			// 			DATE_ADDED DATE,
			// 			DATE_UPDATED DATE,
			// 			CATEGORY TEXT
			// 				)`

			// _, err = db.Exec(context.Background(), blogQuery)

						blogQuery := `CREATE TABLE IF NOT EXISTS BLOG_POSTS (
						ID INTEGER PRIMARY KEY,
						TITLE TEXT,
						BODY TEXT,
						THUMBNAIL BLOB,
						SERVINGS TEXT,
						PREP_TIME TEXT,
						COOK_TIME TEXT,
						DATE_ADDED DATE,
						DATE_UPDATED DATE,
						CATEGORY TEXT
							)`

			_, err = db.Exec( blogQuery)

			if err != nil {
				panic(err)
			}

			// 			recipeQuery := `CREATE TABLE IF NOT EXISTS BLOG_INGREDIENTS (
			// 			BLOG_ID BIGSERIAL REFERENCES BLOG_POSTS(ID),
			// 			NAME TEXT,
			// 			AMOUNT NUMERIC,
			// 			UNIT TEXT
			// 				)`

			// _, err = db.Exec(context.Background(), recipeQuery)


						recipeQuery := `CREATE TABLE IF NOT EXISTS BLOG_INGREDIENTS (
									BLOG_ID INTEGER ,
									NAME TEXT,
									AMOUNT NUMERIC,
									UNIT TEXT,
									FOREIGN KEY (BLOG_ID) REFERENCES BLOG_POSTS(ID)
									);`

			_, err = db.Exec(recipeQuery)

			if err != nil {
				panic(err)
			}

			// instructionsQuery := `CREATE TABLE IF NOT EXISTS BLOG_INSTRUCTIONS (
			// 			BLOG_ID BIGSERIAL REFERENCES BLOG_POSTS(ID),
			// 			ORDER NUMERIC,
			// 			CONTENT TEXT
			// 				)`

			// _, err = db.Exec(context.Background(), instructionsQuery)

			instructionsQuery := `CREATE TABLE IF NOT EXISTS BLOG_INSTRUCTIONS (
						BLOG_ID INTEGER ,
						INSTRUCTION_ORDER NUMERIC,
						CONTENT TEXT,
						FOREIGN KEY (BLOG_ID) REFERENCES BLOG_POSTS(ID)
							)`

			_, err = db.Exec( instructionsQuery)

			if err != nil {
				panic(err)
			}


			r.Use(gzip.Gzip(gzip.DefaultCompression))



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

	lmt := tollbooth.NewLimiter(5, &limiter.ExpirableOptions{DefaultExpirationTTL: time.Minute})

	{
        api.POST("/postBlog", uploadBlog(ctx, db))
        api.GET("/getBlogs", getBlogs(ctx, db))
        api.GET("/getCategories", getCategories(ctx, db))
        api.GET("/getThumbnail/:id", getThumbnail(ctx, db))
        api.GET("/getBlogDetails/:slug", getBlogDetails(ctx, db))
        api.GET("/searchBlogs", searchBlogs(ctx, db))
        api.POST("/admin", LimitMiddleware(lmt),  verifyAdminPass)
    }

	// r.POST("api/postBlog", uploadBlog(ctx, db))
	// r.GET("api/getBlogs", getBlogs(ctx, db))

	// r.Static("/", "front-end\\dist\\front-end\\browser")

	r.LoadHTMLGlob("templates/*.html")



	r.Use(static.Serve("/", static.LocalFile("front-end/dist/front-end/browser", false)))



		r.NoRoute(func(g *gin.Context) {
			if !strings.HasPrefix(g.Request.URL.Path, "/api/") {
				g.File("front-end\\dist\\front-end\\browser\\index.html")
			} else if strings.Contains(g.Request.URL.Path, ".") {
				g.Status(404)
				return
			}else {
				g.JSON(http.StatusNotFound, gin.H{"message": "No Content"})
			}

		})

	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
	}


//  r.Run("0.0.0.0:" + port)
	r.Run(":8080")

}


func getCategories(c context.Context, db *sql.DB) gin.HandlerFunc {
	return func (g *gin.Context) {

		var categories []string
		query := `SELECT DISTINCT CATEGORY
				FROM BLOG_POSTS`

		rows, err := db.Query( query)

			if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "Error fetching categories!"})
			return
		}

		defer rows.Close()

		for rows.Next() {
			var category string

			err := rows.Scan(&category)

					if err != nil {
				log.Print(err)
				g.JSON(http.StatusInternalServerError, gin.H{"message": "Error scanning rows!"})
				return
			}

			categories = append(categories, category)
		}



		 g.JSON(http.StatusOK, categories)



	}
}
func getBlogs(c context.Context, db *sql.DB) gin.HandlerFunc {
	return func(g *gin.Context) {

		recent := g.Query("recent")


		var blogs []BLOG

		var query string

		if recent != "" {

				 query  = `SELECT TITLE, BODY, ID, CHAR(DATE_ADDED, 'YYYY-MM-DD'), CHAR(DATE_UPDATED, 'YYYY-MM-DD'), CATEGORY
								FROM BLOG_POSTS
								ORDER BY DATE_ADDED DESC
								LIMIT 3`

		}else {

			 query  = `SELECT TITLE, BODY, ID, CHAR(DATE_ADDED, 'YYYY-MM-DD'), CHAR(DATE_UPDATED, 'YYYY-MM-DD'), CATEGORY
								FROM BLOG_POSTS`
		}


		rows, err := db.Query(query)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "Error fetching blogs!"})
			log.Print(err)
			return
		}

		defer rows.Close()

		for rows.Next() {
			var blog BLOG

			var categories *string

			err = rows.Scan(&blog.TITLE, &blog.BODY, &blog.ID, &blog.DATE_ADDED, &blog.DATE_UPDATED, &categories)

			if err != nil {
				log.Print(err)
				g.JSON(http.StatusInternalServerError, gin.H{"message": "Error scanning rows!"})
				return
			}

			if categories != nil {
				categoryArr := strings.Split(strings.ToUpper(*categories), ",")
				blog.CATEGORY = &categoryArr
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
				type INGREDIENT struct {
			NAME string
			AMOUNT int64
			UNIT string
		}
		type INSTRUCTION struct {
			ORDER int64
			CONTENT string
		}

		type BLOG_POST struct {
			TITLE string
			ID int64
			SLUG string
			BODY  template.HTML
			DATE_ADDED string
			CATEGORY string
			INGREDIENTS []INGREDIENT
			INSTRCTIONS []INSTRUCTION
		}

		var blog BLOG_POST
		var ingredients []INGREDIENT
		var instructions []INSTRUCTION

		slug := g.Param("slug")

		cachedBlog, found := cache.Get(slug)

		if (found) {
					g.HTML(http.StatusOK, "blog_detail.html", cachedBlog)
		}else {
		cleanedSlug := strings.ReplaceAll(slug, "-", "")

		blog.SLUG = slug

		query := `SELECT ID, TITLE, BODY, CHAR(DATE_ADDED, 'YYYY-MM-DD')
				FROM BLOG_POSTS
				WHERE LOWER(REPLACE(TITLE, ' ', '')) = ?`

		row := db.QueryRow(query,cleanedSlug)

		var rawBody string;

		err := row.Scan(&blog.ID, &blog.TITLE, &rawBody, &blog.DATE_ADDED)

		ingredientsQuery := `SELECT I.NAME, I.AMOUNT,I.UNIT
									FROM BLOG_INGREDIENTS I
									where I.BLOG_ID = ?`

		ingredientRows, err := db.Query(ingredientsQuery, blog.ID)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get ingredient rows"})
			log.Print(err)
			return
		}

		defer ingredientRows.Close()
		for ingredientRows.Next() {
			var ingredient INGREDIENT
			err := ingredientRows.Scan(&ingredient.NAME,&ingredient.AMOUNT,&ingredient.UNIT)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "failed to scan ingredient"})
			log.Print(err)
			return
		}

		ingredients = append(ingredients, ingredient)
		}

		instructionsQuery := `SELECT INSTRUCTION_ORDER, CONTENT
							FROM BLOG_INSTRUCTIONS
							WHERE BLOG_ID = ?`


		instructionRows, err := db.Query(instructionsQuery, blog.ID)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get ingredient rows"})
			log.Print(err)
			return
		}

		defer instructionRows.Close()
		for instructionRows.Next() {
			var instruction INSTRUCTION
			err := instructionRows.Scan(&instruction.ORDER, &instruction.CONTENT)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "failed to scan instruction"})
			log.Print(err)
			return
		}

		instructions = append(instructions, instruction)
		}

		cleaned := re.ReplaceAllString(rawBody, "")

		blog.BODY = template.HTML(cleaned)

		blog.INGREDIENTS = ingredients
		blog.INSTRCTIONS = instructions

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

		type INGREDIENT struct {
			NAME string
			AMOUNT int64
			UNIT string
		}
		type INSTRUCTION struct {
			ORDER int64
			CONTENT string
		}

		type BLOG_POST_FORM struct {
			TITLE string
			BODY  string
			CATEGORY string
			INGREDIENTS string
			INSTRCTIONS string
		}
		type BLOG_POST struct {
			TITLE string
			BODY  string
			CATEGORY string
			INGREDIENTS []INGREDIENT
			INSTRCTIONS []INSTRUCTION
		}

		var postForm BLOG_POST_FORM
		var post BLOG_POST

		err := g.ShouldBind(&postForm)

		post = BLOG_POST{
			TITLE: postForm.TITLE,
			BODY: postForm.BODY,
			CATEGORY: postForm.CATEGORY,
		}

		json.Unmarshal([]byte(postForm.INGREDIENTS, ), &post.INGREDIENTS)
		json.Unmarshal([]byte(postForm.INSTRCTIONS, ), &post.INSTRCTIONS)

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




		query := `
				INSERT INTO BLOG_POSTS (TITLE, BODY, DATE_ADDED, THUMBNAIL, CATEGORY)
	 			VALUES (?,?, CURRENT_TIMESTAMP, ?, ?)
		`

		// var id int
		// err = db.QueryRow(query, post.TITLE, post.BODY, bytes, post.CATEGORY).Scan(&id)
		res, err := db.Exec(query, post.TITLE, post.BODY, bytes, post.CATEGORY)

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured trying to get the id"})
			log.Print(err)
			return

		}

		id, err := res.LastInsertId()



		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured trying to get the id"})
			return

		}

		recipeQuery := `INSERT INTO BLOG_INGREDIENTS (BLOG_ID, NAME, AMOUNT, UNIT)
						VALUES (?,?, ?, ?)`

		for _, r := range post.INGREDIENTS {

			_, err := db.Exec( recipeQuery, id, r.NAME, r.AMOUNT, r.UNIT )
			if err != nil {
				g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured trying to Iinsert recipes"})
				log.Print(err)
				return

		}

		}

		instructionQuery := `INSERT INTO BLOG_INSTRUCTIONS (BLOG_ID, ORDER, CONTENT)
						VALUES(?, ?, ?)`

		for _, instruction := range post.INSTRCTIONS {
			_, err := db.Exec( instructionQuery, instruction.ORDER, instruction.CONTENT)
			if err != nil {
				g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured trying to Iinsert instruction"})
				return
			}
		}

		g.JSON(http.StatusOK, gin.H{"ID": id})

	}

}


func searchBlogs(c context.Context, db *sql.DB) gin.HandlerFunc {

	type BLOG_SEARCH struct {
		ID int
		TITLE string
		SLUG string
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

			blog.SLUG = strings.ReplaceAll(blog.TITLE, " ", "-")

			searchResults = append(searchResults, blog)

	}

	g.JSON(http.StatusOK, searchResults)


	}


}


func verifyAdminPass(g *gin.Context) {

		type PASS struct {
			PASSWORD string
		}

		var pass PASS

		actualPass := os.Getenv("FOOD_BLOG_ADMIN_PASS")
		err := g.BindJSON(&pass)

		if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "invalid params"})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(actualPass), []byte(pass.PASSWORD))


		if (err == nil) {
			g.JSON(http.StatusOK, gin.H{"message": "success"})
			return
		}else {
			g.JSON(http.StatusForbidden, gin.H{"message": "you do not have access!!"})
			return
		}
}

func LimitMiddleware(lmt *limiter.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		httpError := tollbooth.LimitByRequest(lmt, c.Writer, c.Request)
		if httpError != nil {
			c.Header("Content-Type", "application/json")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": "Too many login attempts, please try again later.",
			})
			return
		}
		c.Next()
	}

}

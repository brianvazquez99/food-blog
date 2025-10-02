package main

import (
	"database/sql"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)





func main() {
	 r := gin.Default()

	 r.Static("/","front-end\\dist\\front-end\\browser")

	 r.NoRoute(func (g *gin.Context) {
		 if (!strings.HasPrefix(g.Request.URL.Path, "/api/")) {
			g.File("front-end\\dist\\front-end\\browser\\index.html")
		 }else {
			g.JSON(http.StatusNotFound, gin.H{"message": "No Content"})
		 }
	 })


	 db, err := sql.Open("sqlite", "./blog.db")

	 defer db.Close();

	 if db == nil {
		log.Fatal("Could not connect to db!!")
	 }

	 if err := db.Ping(); err != nil {
        panic(err)
    }


	 if err != nil {
		log.Fatal(err)
	 }




	 r.Run(":8080")
}


func uploadBlog(g *gin.Context, db *sql.DB) {
	type BLOG_POST struct {
		TITLE string
		BODY string
	}

	var post BLOG_POST

	err := g.ShouldBindJSON(&post)

	if err != nil {
		g.JSON(http.StatusBadRequest, gin.H{"message": "Incorrect format to post blog!"})
	}

	 query := `INSERT INTO BLOG-POSTS (TITLE, BODY)
	 			VALUES (?,?)`


	result, err := db.Exec(query, post.TITLE, post.BODY)

	if err != nil {
		g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured inserting the blog"})
	}

	id, err := result.LastInsertId()

	if err != nil {
		g.JSON(http.StatusInternalServerError, gin.H{"message": "an error occured trying to get the id"})

	}

			g.JSON(http.StatusOK, gin.H{"ID": id})



}

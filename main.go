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

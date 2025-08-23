package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
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

	 r.Run(":8080")
}

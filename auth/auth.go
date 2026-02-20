package auth

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

	type PASS struct {
		PASSWORD string
	}

	type TOKEN struct {
		UserID string
		Issuer string
		Audience string
		Expiration time.Time


	}

func Login(g *gin.Context) {

		var pass PASS

		actualPass := os.Getenv("FOOD_BLOG_ADMIN_PASS")
		err := g.BindJSON(&pass)

		log.Println(pass)

		if err != nil {
			g.JSON(http.StatusBadRequest, gin.H{"message": "invalid params"})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(actualPass), []byte(pass.PASSWORD))

		if err != nil {
			g.JSON(http.StatusForbidden, gin.H{"message": "Incorrect Password"})
			return
		}

		token , err := issueToken()

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "Error Generating Token"})
			log.Print(err)
			return
		}

		g.SetSameSite(http.SameSiteLaxMode)
		g.SetCookie("token",token, int(time.Until(time.Now().Add(30 * time.Minute)).Seconds()), "/", "", true, true)

		g.Status(http.StatusOK)
}

func issueToken() (string , error) {

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject: "Admin",
		Issuer: "MailanHomeBakery",
		Audience: jwt.ClaimStrings{"MailanHomeBakeryClient"},
		IssuedAt: jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * time.Minute)),
	})

	signedToken, err := token.SignedString([]byte("secret"))

	if err != nil {
		return "", err
	}else {
		return signedToken, nil
	}



}

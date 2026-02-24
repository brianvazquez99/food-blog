package auth

import (
	"errors"
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

	// TODO:UPDATE SECRET STRING TO BE ENV VARIABLE
	signedToken, err := token.SignedString([]byte("secret"))

	if err != nil {
		return "", err
	}else {
		return signedToken, nil
	}



}

// TODO:CREATE MIDDLEWARE FOR CHECKING TOKEM

func CheckTokenMiddleware(g *gin.Context)  {

	// secret := os.Getenv("secret")
	secret := "secret"

	token, err := g.Cookie("token")

	if err != nil {
		g.JSON(http.StatusForbidden, gin.H{"message": "No token!"})
		return
	}

	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	parsedToken, err := parser.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC);!ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		g.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Error parsing token"})
		return
	}

	claims, ok := parsedToken.Claims.(*jwt.RegisteredClaims)
		if !ok || !parsedToken.Valid {

		g.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Invalid Token"})
		return
	}

		if claims.ExpiresAt != nil && time.Now().After(claims.ExpiresAt.Time) {
		g.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Token Expired!"})
		return
	}

	log.Println(claims.ExpiresAt)
	log.Println(parsedToken.Valid)

	g.Next()

}

func CheckToken(g *gin.Context)  {

	// secret := os.Getenv("secret")
	secret := "secret"

	token, err := g.Cookie("token")

	if err != nil {
		g.JSON(http.StatusForbidden, gin.H{"message": "No token!"})
		return
	}

	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	parsedToken, err := parser.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC);!ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		g.JSON(http.StatusForbidden, gin.H{"message": "Error parsing token"})
		return
	}

	claims, ok := parsedToken.Claims.(*jwt.RegisteredClaims)
		if !ok || !parsedToken.Valid {

		g.JSON(http.StatusForbidden, gin.H{"message": "Invalid Token"})
		return
	}

		if claims.ExpiresAt != nil && time.Now().After(claims.ExpiresAt.Time) {
		g.JSON(http.StatusForbidden, gin.H{"message": "Token Expired!"})
		return
	}

	log.Println(claims.ExpiresAt)
	log.Println(parsedToken.Valid)

	g.JSON(http.StatusOK, gin.H{"message":"token valid"})

}

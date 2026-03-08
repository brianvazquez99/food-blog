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
		refreshToken , err := issueRefreshToken()

		if err != nil {
			g.JSON(http.StatusInternalServerError, gin.H{"message": "Error Generating Token"})
			log.Print(err)
			return
		}

		g.SetSameSite(http.SameSiteLaxMode)
		g.SetCookie("token",token, int(time.Until(time.Now().Add(60 * time.Minute)).Seconds()), "/", "", true, true)

		g.SetSameSite(http.SameSiteLaxMode)
		g.SetCookie("refreshToken",refreshToken, int(time.Until(time.Now().Add(24 * time.Hour)).Seconds()), "/", "", true, true)

		g.Status(http.StatusOK)
}


func issueToken() (string , error) {

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject: "Admin",
		Issuer: "MailanHomeBakery",
		Audience: jwt.ClaimStrings{"MailanHomeBakeryClient"},
		IssuedAt: jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(60 * time.Minute)),
	})

	secret := os.Getenv("TOKEN_SECRET")
	signedToken, err := token.SignedString([]byte(secret))

	if err != nil {
		return "", err
	}else {
		return signedToken, nil
	}



}
func issueRefreshToken() (string , error) {

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject: "AdminRefresh",
		Issuer: "MailanHomeBakery",
		Audience: jwt.ClaimStrings{"MailanHomeBakeryClient"},
		IssuedAt: jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
	})

	refreshSecrert := os.Getenv("REFRESH_SECRET")
	signedToken, err := token.SignedString([]byte(refreshSecrert))

	if err != nil {
		return "", err
	}else {
		return signedToken, nil
	}



}


func CheckTokenMiddleware(g *gin.Context)  {



	token, err := g.Cookie("token")

	if err != nil {
		g.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "No token!"})
		return
	}

	parsedToken, err := parseToken(token)


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

		//IF EXPIRED CHECK REFRSH TOKEN AND REFRESH

		refreshToken, err := g.Cookie("refreshToken")

		if err == nil {

			parsedRefreshToken, _ := parseRefreshToken(refreshToken)

			refreshClaims, refreshOk := parsedRefreshToken.Claims.(*jwt.RegisteredClaims)

			//IF REFRESH TOKEN IS OK AND HAS NOT EXPRIRED YET, REFRESH TOKEN
			if refreshOk && parsedToken.Valid && claims.ExpiresAt != nil && !time.Now().After(refreshClaims.ExpiresAt.Time) {
				newToken, _ := issueToken()

				g.SetSameSite(http.SameSiteLaxMode)
				g.SetCookie("token",newToken, int(time.Until(time.Now().Add(60 * time.Minute)).Seconds()), "/", "", true, true)
				g.Next()
				return
			}
		}



		g.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Token Expired!"})
		return
	}


	g.Next()

}

func parseToken(token string) (*jwt.Token, error) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	secret := os.Getenv("TOKEN_SECRET")

	parsedToken, err := parser.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC);!ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	return parsedToken, err


}

func parseRefreshToken(token string) (*jwt.Token, error) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	secret := os.Getenv("REFRESH_SECRET")

	parsedToken, err := parser.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC);!ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	return parsedToken, err


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

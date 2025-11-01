docker build -t sast:latest . 
docker tag sast:latest vstrandmoe/vanguard-sast:latest
docker push vstrandmoe/vanguard-sast:latest
GIT_REV := $(shell git log -n 1 --format=%H)
NODE_CONTAINER := "karen-irc/app-server"

all:

karen_server_container: ./docker/KarenServer.Dockerfile
	docker build $(CURDIR) -f $< -t $(NODE_CONTAINER):$(GIT_REV)

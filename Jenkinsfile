pipeline {
    agent any

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'main', description: 'Git branch to build')
        string(name: 'IMAGE_NAME', defaultValue: 'task-management-server-image', description: 'Docker image name')
        string(name: 'CONTAINER_NAME', defaultValue: 'task-management-server-container', description: 'Container name for deployment')
        string(name: 'PORT', defaultValue: '4002', description: 'Port to expose for the container')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    // environment {
    //     REPO_URL = "https://github.com/pra3tha3p/task-management-server.git"
    // }

    stages {

        stage('Checkout Source') {
            steps {
                script {
                    echo('Cleaning workspace...')
                    deleteDir()

                    echo("Cloning branch '${params.BRANCH_NAME}' from ${env.REPO_URL}")
                    withCredentials([usernamePassword(credentialsId: 'github-credential', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh """
                            git clone -b ${params.BRANCH_NAME} https://${GIT_USER}:${GIT_TOKEN}@github.com/pra3tha3p/task-management-server.git
                        """
                    }

                    sh 'echo "Repo contents:" && ls -la'
                }
            }
        }

        stage('Build Docker Image') {
                steps {
                    script {
                        echo("Building Docker image: ${params.IMAGE_NAME}:latest")
                        sh '''
                            docker build -t ${IMAGE_NAME}:latest .
                        '''
                    }
                }
            }

        stage('Inject .env from Jenkins Credential') {
            steps {
                script {
                    echo('Copying .env from Jenkins secret...')
                    withCredentials([file(credentialsId: 'task-management-server-env', variable: 'ENV_FILE_PATH')]) {
                        sh '''
                            cp "$ENV_FILE_PATH" .env
                            chmod 600 .env
                            echo ".env copied successfully from Jenkins credentials"

                            echo "--- DEBUG: PRINTING .ENV FILE CONTENTS ---"
                            cat .env
                            echo "--- END .ENV FILE ---"
                        '''
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    echo('Removing old container if exists...')
                    sh '''
                        docker ps -a --format '{{.Names}}' | grep -w ${CONTAINER_NAME} >/dev/null && \
                        (docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}) || true
                    '''

                    echo('Starting new container...')
                    sh '''
                        docker run -d \
                        --name ${CONTAINER_NAME} \
                        --env-file .env \
                        -p ${PORT}:${PORT} \
                        ${IMAGE_NAME}:latest
                    '''
                }
            }
        }
    }

    post {
        success {
            echo('Pipeline completed successfully.')
            sh "docker ps --filter name=${params.CONTAINER_NAME} --format 'Name: {{.Names}} | Image: {{.Image}} | Status: {{.Status}}'"
        }
        failure {
            echo('Pipeline failed. Review logs above.')
        }
    }
}
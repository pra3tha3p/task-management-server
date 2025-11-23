pipeline {
    agent any

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'main')
        string(name: 'IMAGE_NAME', defaultValue: 'task-management-server-image')
        string(name: 'CONTAINER_NAME', defaultValue: 'task-management-server-container')
        string(name: 'PORT', defaultValue: '4002')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout Source') {
            steps {
                script {
                    deleteDir()

                    withCredentials([usernamePassword(credentialsId: 'github-credential', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh """
                            git clone -b ${params.BRANCH_NAME} https://${GIT_USER}:${GIT_TOKEN}@github.com/pra3tha3p/task-management-server.git
                        """
                    }

                    sh "ls -la"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dir('task-management-server') {
                        sh """
                            docker build -t ${params.IMAGE_NAME}:latest .
                        """
                    }
                }
            }
        }

        stage('Inject .env from Jenkins Credential') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'task-management-server-env', variable: 'ENV_FILE_PATH')]) {
                        dir('task-management-server') {
                            sh """
                                cp "\$ENV_FILE_PATH" .env
                                chmod 600 .env
                                echo "--- .env contents ---"
                                cat .env
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    sh """
                        docker ps -a --format '{{.Names}}' | grep -w ${params.CONTAINER_NAME} >/dev/null && \
                        (docker stop ${params.CONTAINER_NAME} && docker rm ${params.CONTAINER_NAME}) || true
                    """

                    dir('task-management-server') {
                        sh """
                            docker run -d \
                            --name ${params.CONTAINER_NAME} \
                            --env-file .env \
                            -p ${params.PORT}:${params.PORT} \
                            ${params.IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            sh "docker ps --filter name=${params.CONTAINER_NAME} --format 'Name: {{.Names}} | Image: {{.Image}} | Status: {{.Status}}'"
        }
        failure {
            echo('Pipeline failed.')
        }
    }
}

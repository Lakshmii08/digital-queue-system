
pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
    }

    stages {
        stage('1. Checkout') {
            steps {
                checkout scm
            }
        }

        stage('2. Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('3. Automated Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('4. Application Build') {
            steps {
                bat 'npm run build'
            }
        }

        stage('5. Docker Build') {
            steps {
                bat 'docker build -t digital-queue-system:latest .'
            }
        }

        stage('6. Deploy Container') {
            steps {
                bat 'docker rm -f queue-app || exit /b 0'
                bat 'docker run -d --name queue-app -p 3001:3000 --restart unless-stopped digital-queue-system:latest'
            }
        }

        stage('7. Verify Deployment') {
            steps {
                bat '''
                powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; for ($i=0; $i -lt 15; $i++) { try { $r=Invoke-WebRequest -UseBasicParsing http://localhost:3001/health; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 2 }; exit 1"
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Application tested, built and deployed.'
            echo 'Application URL: http://localhost:3001'
        }

        failure {
            echo 'FAILED: Check the failed stage in the Jenkins console log.'
        }
    }
}

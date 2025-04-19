pipeline {
    agent any // Run on any available Jenkins agent (node)

    tools {
        // Use the NodeJS installation configured in Jenkins Global Tools
        nodejs 'NodeJS23' // MUST match the name you gave in Step 9
    }

    environment {
        PORT=3000
        NODE_ENV=development 
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout code from the Git repository configured in the Jenkins job
                // Uses the credentials specified in the job configuration
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Run npm install (or yarn install)
                echo 'Installing dependencies...'
                // Use sh for shell commands. Use bat for Windows agents.
                sh 'npm install'
                // Or: sh 'yarn install'
            }
        }

        stage('Build') {
            // This stage assumes you have a build script in package.json
            // "scripts": { "build": "tsc" } or similar
            steps {
                echo 'Building project (Compiling TypeScript)...'
                sh 'npm run build'
            }
        }

        stage('Test') {
            // This stage assumes you have a test script in package.json
            // "scripts": { "test": "jest" } or similar
            steps {
                echo 'Running tests...'
                sh 'npm test'
            }
            // Optional: Publish test results for better reporting
            // post {
            //     always {
            //         junit 'junit.xml' // Assumes your test runner outputs JUnit XML results
            //     }
            // }
        }

        // --- Continuous Delivery/Deployment Stages (Examples) ---
        // These are highly dependent on your deployment target

        /*
        stage('Archive Artifacts') {
            // Optional: Save build artifacts (e.g., the 'dist' folder)
            steps {
                echo 'Archiving build artifacts...'
                archiveArtifacts artifacts: 'dist/**/*', fingerprint: true // Adjust 'dist/**/*' path as needed
            }
        }
        */

        /*
        stage('Deploy to Staging') {
            // Only run on the main/master branch
            when { branch 'main' } // or 'master', or your primary branch
            steps {
                echo 'Deploying to Staging environment...'
                // Add your deployment commands here
                // Example using SCP/SSH:
                // withCredentials([sshUserPrivateKey(credentialsId: 'staging-server-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                //     sh 'scp -i $KEY_FILE -r dist/* user@staging.example.com:/var/www/myapp'
                //     sh 'ssh -i $KEY_FILE user@staging.example.com "cd /var/www/myapp && npm install --production && pm2 restart myapp"'
                // }
                // Example using Docker:
                // sh 'docker build -t myapp-image .'
                // sh 'docker push myregistry.example.com/myapp-image:latest'
                // sh 'ssh user@staging.example.com "docker pull myregistry.example.com/myapp-image:latest && docker stop myapp-container && docker rm myapp-container && docker run --name myapp-container -d -p 3000:3000 myregistry.example.com/myapp-image:latest"'
             }
        }
        */

        /*
        stage('Deploy to Production') {
            // Manual approval and only on the main branch
             when { branch 'main' }
             input { // Pause for manual approval
                 message "Deploy to Production?"
                 ok "Yes, Deploy!"
             }
             steps {
                 echo 'Deploying to Production environment...'
                 // Add production deployment steps here (similar to staging but with production configs/servers)
             }
        }
        */
    }

    post {
        // Actions to perform after the pipeline finishes, regardless of status
        always {
            echo 'Pipeline finished.'
            // cleanWs() // Clean up the workspace
        }
        success {
            echo 'Pipeline succeeded!'
            // Send notification, etc.
        }
        failure {
            echo 'Pipeline failed!'
            // Send error notification, etc.
        }
    }
}
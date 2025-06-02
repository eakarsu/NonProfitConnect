# NonProfit Connect - Community Funding Platform

A cutting-edge community funding platform that revolutionizes project discovery, investment, and collaboration through an intuitive digital marketplace.

## Features

- **Multi-role System**: Applicants, reviewers, and investors with seamless role switching
- **Project Management**: Submit, review, and track funding applications
- **Investment System**: Direct investment with real-time funding progress
- **Review Workflow**: Comprehensive approval/rejection system with notifications
- **Multi-provider Authentication**: Support for Replit, Google, GitHub, and email/password
- **Real-time Notifications**: Stay updated on project status changes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Multi-provider (Replit, Google, GitHub, Local)
- **Build Tools**: Vite, ESBuild
- **State Management**: TanStack Query

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your system
- At least 2GB free disk space

### Quick Start with Docker Compose

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd nonprofit-connect
   ```

2. **Start the application**:
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database on port 5432
   - Build and start the application on port 5000
   - Automatically create the database schema

3. **Access the application**:
   Open your browser and navigate to: `http://localhost:5000`

4. **Stop the application**:
   ```bash
   docker-compose down
   ```

5. **Stop and remove all data**:
   ```bash
   docker-compose down -v
   ```

### Manual Docker Build

If you prefer to build and run manually:

1. **Build the Docker image**:
   ```bash
   docker build -t nonprofit-connect .
   ```

2. **Run PostgreSQL**:
   ```bash
   docker run -d \
     --name postgres \
     -e POSTGRES_DB=nonprofit_connect \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 \
     postgres:15-alpine
   ```

3. **Run the application**:
   ```bash
   docker run -d \
     --name nonprofit-app \
     --link postgres:postgres \
     -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nonprofit_connect \
     -e SESSION_SECRET=your-super-secret-session-key \
     -e REPL_ID=local-docker-instance \
     -e REPLIT_DOMAINS=localhost:5000 \
     -p 5000:5000 \
     nonprofit-connect
   ```

### Environment Variables

The application requires these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Secret key for session encryption | Required |
| `REPL_ID` | Replit application ID | `local-docker-instance` |
| `REPLIT_DOMAINS` | Allowed domains for auth | `localhost:5000` |
| `PORT` | Application port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

### Health Check

The application provides a health endpoint at `/api/health` for monitoring.

## Development

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database**:
   - Start PostgreSQL locally or use Docker
   - Set DATABASE_URL environment variable

3. **Push database schema**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## Authentication Setup

The application supports multiple authentication providers:

### Local Authentication
Works out of the box with email/password registration.

### External Providers
To enable external authentication providers, you'll need to configure:

- **Google OAuth**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **GitHub OAuth**: Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- **Replit OAuth**: Configured via `REPL_ID` and `REPLIT_DOMAINS`

## Usage

1. **Register/Login**: Create an account or use external providers
2. **Choose Role**: Select applicant, reviewer, or investor role
3. **Submit Applications**: Create funding requests with project details
4. **Review Projects**: Approve or reject applications as a reviewer
5. **Invest**: Fund approved projects as an investor
6. **Track Progress**: Monitor investments and application status

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `projects` - Funding applications
- `reviews` - Review decisions and comments
- `investments` - Investment records
- `notifications` - User notifications
- `sessions` - User sessions

## Monitoring

- Health endpoint: `GET /api/health`
- Application logs available via Docker logs
- Database connection monitoring included

## Security Features

- Non-root Docker user
- Session-based authentication
- CSRF protection
- Input validation with Zod
- SQL injection prevention with Drizzle ORM

## Production Deployment

For production deployment:

1. Use a managed PostgreSQL service
2. Set strong SESSION_SECRET
3. Configure proper authentication providers
4. Set up reverse proxy (nginx/Apache)
5. Enable HTTPS
6. Configure monitoring and logging

## Support

For issues and questions, please check the application logs:

```bash
docker-compose logs app
docker-compose logs postgres
```
# Rimo Health Mission Control 🚀

A beautiful, single-page Apple OS-style operations dashboard for Rimo Health. Built with pure HTML, CSS, and JavaScript with glassmorphism design and Linear integration.

![Mission Control Dashboard](https://img.shields.io/badge/Status-Live-green) ![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## ✨ Features

- **Apple Glassmorphism Design** - Dark mode with frosted glass cards, subtle borders, and smooth animations
- **Real-time Linear Integration** - Live tickets from JAR (Jarvis) and FIX (Fixing Rimo) teams
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **Auto-refresh** - Updates every 60 seconds
- **Interactive Elements** - Hover effects, tab switching, clickable tickets
- **Team Org Chart** - Current team members + pulsing open roles
- **8-Week Roadmap** - Visual timeline with current phase indicator
- **Burn Rate Tracking** - Current vs projected monthly spend
- **Placeholder Integrations** - Gmail, Calendar, and Slack ready for OAuth setup

## 🏗️ Architecture

### Single File Deployment
- `index.html` - Complete dashboard (CSS and JS inline)
- `server.js` - Express proxy server for Linear API (CORS handling)
- `package.json` - Dependencies

### Design System
- **Font**: Inter (Google Fonts)
- **Background**: `#09090b` (Apple dark)
- **Glass Cards**: `rgba(255,255,255,0.05)` with `backdrop-filter: blur(20px)`
- **Borders**: `rgba(255,255,255,0.1)` with hover states
- **Animations**: Smooth transitions, pulsing indicators, glow effects

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Linear API access token

### Installation

1. **Clone and setup**:
```bash
git clone <repo-url>
cd rimo-mission-control
npm install
```

2. **Set environment variables**:
```bash
export LINEAR_API_KEY="your_linear_api_key_here"
# or create a .env file:
echo "LINEAR_API_KEY=your_linear_api_key_here" > .env
```

3. **Start the server**:
```bash
npm start
# or
node server.js
```

3. **Open dashboard**:
```
http://localhost:3000
```

### Single File Deployment
For static hosting, just serve `index.html` directly. The Linear integration requires the proxy server for CORS handling.

## 📊 Dashboard Components

### 1. Top Bar
- **Title**: "Rimo Mission Control" with gradient text
- **Status**: Last updated timestamp with pulsing green dot for fresh data

### 2. Team & Open Roles
- **Current Team**: Saamir, Cameron, Jaden, Abdullah, Omar, Osman
- **Open Roles**: Lead Dev, Dev M1, Dev M2, Sales Manager, Account Manager, Product Owner
- **Animation**: Open roles pulse with glowing border

### 3. Linear Tickets
- **Three Tabs**: Blockers / In Progress / All
- **Live Data**: Real-time from Linear API
- **Features**: State badges, priority icons, progress bars, blocking indicators
- **Clickable**: Opens tickets in Linear app

### 4. Important Emails (Placeholder)
- **Sample Data**: Stripe, Linear, investor, compliance, candidate emails
- **Visual Indicators**: Unread dots, sender, subject, timestamp
- **Note**: Requires Gmail OAuth for live data

### 5. Upcoming Events (Placeholder)
- **Sample Events**: Team standup, product review, investor check-in
- **Format**: Time + event title
- **Note**: Requires Google Calendar OAuth

### 6. Cameron Bug Frequency
- **Metric**: @mentions in support channels
- **Visual**: Large number with description
- **Note**: Placeholder for Slack API integration

### 7. Monthly Burn Rate
- **Current**: $38K/month
- **Projected**: $54K/month
- **Visual**: Side-by-side comparison with arrow

### 8. 8-Week Roadmap
- **Phase 1-2**: Stabilize (red) - *Current*
- **Phase 3-4**: Hiring (amber)
- **Phase 5-6**: Systems (green)
- **Phase 7-8**: Operations (blue)
- **Phase 9+**: Rimo OS (purple)
- **Indicator**: Current phase has pulsing dot

## 🔧 Technical Details

### Linear API Integration
```javascript
// GraphQL Query
query {
  teams(filter: { key: { in: ["JAR", "FIX"] } }) {
    nodes {
      issues {
        nodes {
          identifier, title, state, priority, project, children, relations
        }
      }
    }
  }
}
```

### CORS Proxy
The Express server proxies Linear API calls to avoid CORS issues:
```javascript
app.post('/api/linear', async (req, res) => {
  // Proxy to https://api.linear.app/graphql
  // Headers: Authorization: process.env.LINEAR_API_KEY
});
```

### Auto-refresh
```javascript
setInterval(() => {
  loadLinearData();
  updateTimestamp();
}, 60000); // Every 60 seconds
```

## 🎨 Customization

### Colors
```css
:root {
  --bg-primary: #09090b;
  --glass-bg: rgba(255,255,255,0.05);
  --glass-border: rgba(255,255,255,0.1);
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
}
```

### Adding New Cards
1. Add HTML structure in `dashboard-grid`
2. Style with `glass-card` class
3. Add JavaScript for data loading
4. Update auto-refresh if needed

## 🔐 Security Notes

- Linear API key is included for demo purposes
- Production deployment should use environment variables
- OAuth integrations require secure token storage
- CORS proxy should validate requests in production

## 🚧 Future Enhancements

### Ready for Implementation
- **Gmail Integration**: OAuth 2.0 + Gmail API
- **Google Calendar**: OAuth 2.0 + Calendar API  
- **Slack Integration**: Bot token + Web API
- **Real-time Updates**: WebSocket connection
- **Mobile App**: PWA with push notifications

### Potential Features
- **Alerts System**: Critical issue notifications
- **Team Performance**: Velocity tracking, cycle time
- **Financial Dashboard**: Revenue, runway, KPIs
- **Customer Health**: Support tickets, NPS scores

## 📱 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support (backdrop-filter)
- **Mobile**: Responsive design

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for Rimo Health**

*"Every pixel matters" - Premium dashboard for founders who care about aesthetics*
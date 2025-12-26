# Security Policy

Mollei is an [Agenisea™](https://agenisea.ai) open source project. Security is foundational to our mission of building trustworthy, emotionally intelligent AI.

## Reporting a Vulnerability

If you discover a security vulnerability in Mollei, please report it responsibly:

1. **Do not** open a public issue
2. Email steward@agenisea.ai or use GitHub's private vulnerability reporting feature
3. Include a detailed description of the vulnerability
4. Provide steps to reproduce if possible

We will respond within 48 hours and work with you to understand and address the issue.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | Yes                |

## Security Considerations

### Data Privacy

Mollei is designed with privacy as a core principle:
- Emotional data belongs to users, not platforms
- No surveillance or profiling without explicit consent
- Data minimization — we don't collect what we don't need

### API Keys

- Never commit API keys to the repository
- Use `.env.local` for local development (gitignored by default)
- In production, use environment variables from your hosting provider

### Input Validation

All user inputs are validated before processing to prevent injection attacks.

## Ethical Security

Beyond technical security, Mollei considers ethical security:
- Protection against emotional manipulation
- Safeguards against dependency-creating patterns
- Clear boundaries between AI assistance and human support

See [STEWARDSHIP.md](./STEWARDSHIP.md) for our full ethical framework.

## Best Practices for Deployment

1. Set `NEXT_PUBLIC_APP_URL` to your production domain
2. Use HTTPS in production
3. Configure your hosting provider's security headers
4. Review the Hippocratic License terms before deployment
5. Ensure your use case aligns with our ethical guidelines

## Contact

For general questions: [GitHub Discussions](https://github.com/agenisea/mollei/discussions)

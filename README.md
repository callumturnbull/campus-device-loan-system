Campus Device Loan System  
Student Name: Callum Turnbull  
Student ID: F5083318

This project implements a cloud native device loan system using Azure Functions,
a static frontend, and CI/CD via GitHub Actions.

Live URLs:
Main Site: https://cndfront1767889644.z33.web.core.windows.net/
Catalogue API: https://cnd-catalogue-test-ct1.azurewebsites.net/api/health
Loans API: https://cnd-loans-test-ct1.azurewebsites.net/api/health

Services:
- Catalogue Service (devices + availability)
- Loans Service (reservations, collection, returns)
- Frontend demo page

Security:
- HTTPS enforced
- JWT/Auth0 designed (documented in report)

Deployment:
- GitHub Actions CI/CD
- Azure Functions (serverless)

mock user credentials for Auth0 if functionaly applied to a real world system.
email: student@demo.com
password: student@111

email: staff@demo.com
password: staff@111
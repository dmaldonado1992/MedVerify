/**
 * Estilos CSS para los emails de MedVerify
 * Se mantienen en un archivo separado para facilitar el mantenimiento
 */

const emailStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
    background-color: #f8f9fa;
    color: #2c3e50;
    line-height: 1.6;
  }
  
  .wrapper {
    background-color: #f8f9fa;
    padding: 20px;
  }
  
  .container {
    max-width: 580px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  
  .header {
    background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
    padding: 45px 30px;
    text-align: center;
    color: white !important;
  }
  
  .header-logo {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  
  .header-subtitle {
    font-size: 14px;
    opacity: 0.95;
    font-weight: 300;
    letter-spacing: 0.3px;
  }
  
  .body-content {
    padding: 45px 30px;
  }
  
  .greeting {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 20px;
  }
  
  .notification-box {
    background: linear-gradient(135deg, #e8f4f8 0%, #f0f8fc 100%);
    border-left: 5px solid #0066cc;
    padding: 20px;
    border-radius: 8px;
    margin: 25px 0;
  }
  
  .notification-box p {
    font-size: 15px;
    color: #34495e;
    line-height: 1.7;
  }
  
  .notification-box strong {
    color: #0052a3;
  }
  
  .credentials-box {
    background: #f5f5f5;
    border: none;
    border-radius: 12px;
    padding: 40px 30px;
    margin: 35px 0;
    text-align: center;
  }
  
  .credentials-title {
    font-size: 14px;
    font-weight: 600;
    color: #555;
    margin-bottom: 30px;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1.2px;
  }
  
  .credential {
    margin-bottom: 30px;
  }
  
  .credential:last-child {
    margin-bottom: 0;
  }
  
  .credential-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
  }
  
  .credential-value {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    font-family: 'Courier New', monospace;
    font-size: 28px;
    font-weight: 700;
    color: #333;
    letter-spacing: 2px;
    word-break: break-all;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .cta-button {
    display: inline-block;
    width: 100%;
    padding: 16px 0;
    margin: 35px 0;
    background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
    color: white !important;
    text-decoration: none;
    text-align: center;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 102, 204, 0.3);
  }
  
  .cta-button:hover {
    background: linear-gradient(135deg, #0052a3 0%, #003d7a 100%);
    color: white !important;
    box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
    transform: translateY(-2px);
  }
  
  .steps {
    background: #fafbfc;
    border-radius: 8px;
    padding: 25px;
    margin: 30px 0;
  }
  
  .steps-title {
    font-size: 14px;
    font-weight: 700;
    color: #0052a3;
    margin-bottom: 18px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .steps ol {
    margin: 0;
    padding-left: 20px;
    counter-reset: step-counter;
    list-style: none;
  }
  
  .steps li {
    font-size: 14px;
    color: #34495e;
    margin: 10px 0;
    line-height: 1.6;
    padding-left: 8px;
    position: relative;
  }
  
  .steps li:before {
    content: counter(step-counter);
    counter-increment: step-counter;
    position: absolute;
    left: -28px;
    top: 0;
    background: #0066cc;
    color: white;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
  }
  
  .security-alert {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 15px 18px;
    margin: 25px 0;
    border-left: 4px solid #ff9800;
  }
  
  .security-alert-title {
    font-weight: 700;
    color: #cc7000;
    margin-bottom: 6px;
    font-size: 13px;
  }
  
  .security-alert p {
    font-size: 12px;
    color: #856404;
    line-height: 1.6;
    margin: 0;
  }
  
  .footer {
    background: #f8f9fa;
    padding: 25px 30px;
    text-align: center;
    border-top: 1px solid #e8ecf1;
  }
  
  .footer-text {
    font-size: 12px;
    color: #7f8c8d;
    line-height: 1.8;
    margin: 0;
  }
  
  .footer-brand {
    font-weight: 700;
    color: #0066cc;
    font-size: 13px;
  }
  
  .divider {
    height: 1px;
    background: #e8ecf1;
    margin: 20px 0;
  }
  
  @media (max-width: 600px) {
    .body-content {
      padding: 30px 20px;
    }
    
    .credentials-box {
      padding: 20px;
    }
    
    .header {
      padding: 35px 20px;
    }
    
    .header-logo {
      font-size: 28px;
    }
  }
`;

module.exports = {
  emailStyles
};

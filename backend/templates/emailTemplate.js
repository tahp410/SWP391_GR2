// Email template styles
const emailStyles = {
  body: `
    margin: 0; 
    padding: 0; 
    font-family: Arial, sans-serif; 
    background-color: #1a1a1a; 
    color: #ffffff;
  `,
  
  container: `
    max-width: 600px; 
    margin: 0 auto; 
    background: linear-gradient(135deg, #311017 0%, #7a1f1f 100%); 
    padding: 0;
  `,
  
  header: `
    text-align: center; 
    padding: 40px 20px 30px; 
    background: linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.3) 100%);
  `,
  
  headerTitle: `
    margin: 0; 
    color: #d4af37; 
    font-size: 36px; 
    font-weight: bold; 
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  `,
  
  headerSubtitle: `
    margin: 10px 0 0; 
    color: #ffeb9c; 
    font-size: 16px;
  `,
  
  mainContent: `
    padding: 40px 30px;
  `,
  
  contentTitle: `
    color: #d4af37; 
    margin: 0 0 20px; 
    font-size: 24px; 
    text-align: center;
  `,
  
  contentText: `
    color: #e0e0e0; 
    font-size: 16px; 
    line-height: 1.6; 
    margin: 0 0 30px;
  `,
  
  codeContainer: `
    background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); 
    padding: 30px; 
    border-radius: 15px; 
    text-align: center; 
    margin: 30px 0; 
    box-shadow: 0 8px 25px rgba(212,175,55,0.3);
  `,
  
  codeLabel: `
    margin: 0 0 15px; 
    color: #1a1a1a; 
    font-size: 18px; 
    font-weight: bold;
  `,
  
  codeBox: `
    background: rgba(26,26,26,0.9); 
    padding: 20px; 
    border-radius: 10px; 
    display: inline-block; 
    min-width: 200px;
  `,
  
  codeText: `
    font-size: 36px; 
    font-weight: bold; 
    color: #d4af37; 
    letter-spacing: 8px; 
    font-family: 'Courier New', monospace;
  `,
  
  instructionsBox: `
    background: rgba(255,255,255,0.05); 
    border-left: 4px solid #d4af37; 
    padding: 20px; 
    margin: 30px 0; 
    border-radius: 0 8px 8px 0;
  `,
  
  instructionsTitle: `
    color: #d4af37; 
    margin: 0 0 15px; 
    font-size: 18px;
  `,
  
  instructionsList: `
    color: #e0e0e0; 
    margin: 0; 
    padding-left: 20px; 
    line-height: 1.8;
  `,
  
  warningBox: `
    background: rgba(255,69,58,0.1); 
    border: 1px solid rgba(255,69,58,0.3); 
    padding: 20px; 
    border-radius: 8px; 
    margin: 30px 0;
  `,
  
  warningTitle: `
    color: #ff453a; 
    margin: 0 0 15px; 
    font-size: 16px;
  `,
  
  warningList: `
    color: #ffb3b3; 
    margin: 0; 
    padding-left: 20px; 
    font-size: 14px; 
    line-height: 1.6;
  `,
  
  ctaContainer: `
    text-align: center; 
    margin: 40px 0;
  `,
  
  ctaButton: `
    background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); 
    color: #1a1a1a; 
    padding: 15px 30px; 
    text-decoration: none; 
    border-radius: 25px; 
    font-weight: bold; 
    font-size: 16px; 
    display: inline-block; 
    box-shadow: 0 4px 15px rgba(212,175,55,0.3);
  `,
  
  footer: `
    background: rgba(0,0,0,0.3); 
    padding: 30px; 
    text-align: center; 
    border-top: 1px solid rgba(212,175,55,0.2);
  `,
  
  footerText: `
    margin: 0 0 10px; 
    color: #999; 
    font-size: 14px;
  `,
  
  footerCopyright: `
    margin: 0; 
    color: #666; 
    font-size: 12px;
  `,
  
  footerIcons: `
    margin-top: 20px;
  `,
  
  iconsText: `
    color: #d4af37; 
    font-size: 24px;
  `
};

// Generate verification email HTML
const generateVerificationEmailHTML = (code) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CineTicket - Mã xác minh</title>
    </head>
    <body style="${emailStyles.body}">
      <div style="${emailStyles.container}">
        
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="${emailStyles.headerTitle}">
            🎬 CineTicket
          </h1>
          <p style="${emailStyles.headerSubtitle}">
            Đặt vé xem phim dễ dàng, trải nghiệm tuyệt vời
          </p>
        </div>

        <!-- Main Content -->
        <div style="${emailStyles.mainContent}">
          <h2 style="${emailStyles.contentTitle}">
            Xác minh tài khoản của bạn
          </h2>
          
          <p style="${emailStyles.contentText}">
            Chào bạn! Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #d4af37;">CineTicket</strong>. 
            Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác minh bên dưới:
          </p>

          <!-- Verification Code Box -->
          <div style="${emailStyles.codeContainer}">
            <p style="${emailStyles.codeLabel}">
              MÃ XÁC MINH CỦA BẠN
            </p>
            <div style="${emailStyles.codeBox}">
              <span style="${emailStyles.codeText}">
                ${code}
              </span>
            </div>
          </div>

          <!-- Instructions -->
          <div style="${emailStyles.instructionsBox}">
            <h3 style="${emailStyles.instructionsTitle}">📋 Hướng dẫn:</h3>
            <ul style="${emailStyles.instructionsList}">
              <li>Nhập mã <strong style="color: #d4af37;">${code}</strong> vào ô xác minh</li>
              <li style="color: #ffffff;">Hoàn tất đăng ký và bắt đầu đặt vé xem phim!</li>
            </ul>
          </div>

          <!-- Important Notes -->
          <div style="${emailStyles.warningBox}">
            <h3 style="${emailStyles.warningTitle}">⚠️ Lưu ý quan trọng:</h3>
            <ul style="${emailStyles.warningList}">
              <li><strong>Mã có hiệu lực trong 5 phút</strong> kể từ khi nhận email này</li>
              <li>Không chia sẻ mã này với bất kỳ ai khác</li>
              <li>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này</li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="${emailStyles.ctaContainer}">
            <a href="http://localhost:3000" style="${emailStyles.ctaButton}">
              🎬 Quay lại CineTicket
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="${emailStyles.footerText}">
            Email này được gửi tự động từ hệ thống CineTicket
          </p>
          <p style="${emailStyles.footerCopyright}">
            © 2025 CineTicket. Tất cả quyền được bảo lưu.
          </p>
          <div style="${emailStyles.footerIcons}">
            <span style="${emailStyles.iconsText}">🎬🍿🎭🎪🎨</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export { generateVerificationEmailHTML, emailStyles };
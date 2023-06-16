// reset-password-template.js
export const resetPasswordTemplate = (token: string) => `
<!doctype html>
<html lang="en-US">
  <head>
    <style type="text/css">
      a:hover {
        text-decoration: underline !important;
      }
    </style>
  </head>
  <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
    <!--100% body table-->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Roboto', sans-serif;" ;>
      <tr>
        <td>
          <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:80px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align:center;">
                <img width="200" src="https://res.cloudinary.com/dlidl2li4/image/upload/v1686925035/DuitHive/Group_3_paqhen.png" title="logo" alt="logo">
              </td>
            </tr>
            <tr>
              <td style="height:20px;">&nbsp;</td>
            </tr>
            <tr>
              <td>
                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                  <tr>
                    <td style="height:40px;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:0 35px;">
                      <h1 style="color:#1e1e2d; margin:0;font-size:26px;">You have requested to reset your password</h1>
                      <span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                      <p style="color:#455056; font-size:15px;line-height:24px; margin:0;"> We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link. </p>
                      <a href="http://localhost:3000/auth/reset-password?token=${token}" style="background:#9D74F3;text-decoration:none !important; font-weight:30; margin-top:35px; color:#fff;text-transform:uppercase; font-size:16px;padding:10px 24px;display:inline-block;border-radius:10px;">Reset Password</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="height:40px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            <tr>
              <td style="height:20px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="height:80px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <!--/100% body table-->
  </body>
</html>
`;

export default function confirmAccountMail (confirmationToken) {
  const frontendUrl = process.env.FRONTEND_URL

  return `
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <o:OfficeDocumentSettings>
              <o:AllowPNG/>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <!--[if !mso]><!-->
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <!--<![endif]-->
          <title></title>
          <style type="text/css">
            @media only screen and (min-width: 520px) {
            .u-row {
            width: 500px !important;
            }
            .u-row .u-col {
            vertical-align: top;
            }
            .u-row .u-col-100 {
            width: 500px !important;
            }
            }
            @media (max-width: 520px) {
            .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
            }
            .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
            }
            .u-row {
            width: 100% !important;
            }
            .u-col {
            width: 100% !important;
            }
            .u-col > div {
            margin: 0 auto;
            }
            }
            body {
            margin: 0;
            padding: 0;
            }
            table,
            tr,
            td {
            vertical-align: top;
            border-collapse: collapse;
            }
            p {
            margin: 0;
            }
            .ie-container table,
            .mso-container table {
            table-layout: fixed;
            }
            * {
            line-height: inherit;
            }
            a[x-apple-data-detectors='true'] {
            color: inherit !important;
            text-decoration: none !important;
            }
            table, td { color: #000000; } #u_body a { color: #0a0a0a; text-decoration: underline; } @media (max-width: 480px) { #u_column_2 .v-col-padding { padding: 45px 24px !important; } #u_content_heading_2 .v-container-padding-padding { padding: 0px !important; } #u_content_heading_2 .v-font-size { font-size: 38px !important; } #u_content_text_1 .v-container-padding-padding { padding: 40px 0px 25px !important; } #u_content_text_1 .v-font-size { font-size: 16px !important; } #u_content_button_1 .v-container-padding-padding { padding: 10px 0px !important; } #u_content_button_1 .v-padding { padding: 14px 24px 12px !important; } #u_content_text_3 .v-container-padding-padding { padding: 10px 0px 0px !important; } }
          </style>
        </head>
        <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #0a0a0a;color: #000000">
          <!--[if IE]>
          <div class="ie-container">
            <![endif]-->
            <!--[if mso]>
            <div class="mso-container">
              <![endif]-->
              <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #0a0a0a;width:100%" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr style="vertical-align: top">
                    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                      <!--[if (mso)|(IE)]>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="background-color: #0a0a0a;">
                            <![endif]-->
                            <div class="u-row-container" style="padding: 40px 0px;background-color: transparent">
                              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                  <!--[if (mso)|(IE)]>
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding: 40px 0px;background-color: transparent;" align="center">
                                        <table cellpadding="0" cellspacing="0" border="0" style="width:500px;">
                                          <tr style="background-color: transparent;">
                                            <![endif]-->
                                            <!--[if (mso)|(IE)]>
                                            <td align="center" width="500" class="v-col-padding" style="width: 500px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top">
                                              <![endif]-->
                                              <div class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                                                <div style="height: 100%;width: 100% !important;">
                                                  <!--[if (!mso)&(!IE)]><!-->
                                                  <div class="v-col-padding" style="box-sizing: border-box; height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                                                    <!--<![endif]-->
                                                    <table style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:helvetica,sans-serif;" align="left">
                                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                              <tr>
                                                                <td style="padding-right: 0px;padding-left: 0px;" align="center">
                                                                  <a href="${frontendUrl}" target="_blank">
                                                                  <img align="center" border="0" src="https://wrkload.vercel.app/images/mail-logo.png" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 100%;max-width: 180px;" width="180"/>
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <!--[if (!mso)&(!IE)]><!-->
                                                  </div>
                                                  <!--<![endif]-->
                                                </div>
                                              </div>
                                              <!--[if (mso)|(IE)]>
                                            </td>
                                            <![endif]-->
                                            <!--[if (mso)|(IE)]>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <![endif]-->
                                </div>
                              </div>
                            </div>
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                  <!--[if (mso)|(IE)]>
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding: 0px;background-color: transparent;" align="center">
                                        <table cellpadding="0" cellspacing="0" border="0" style="width:500px;">
                                          <tr style="background-color: transparent;">
                                            <![endif]-->
                                            <!--[if (mso)|(IE)]>
                                            <td align="center" width="500" class="v-col-padding" style="background-color: #7686b7;width: 500px;padding: 45px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top">
                                              <![endif]-->
                                              <div id="u_column_2" class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                                                <div style="background-color: #7686b7;height: 100%;width: 100% !important;border-radius: 24px;-webkit-border-radius: 24px; -moz-border-radius: 24px;">
                                                  <!--[if (!mso)&(!IE)]><!-->
                                                  <div class="v-col-padding" style="box-sizing: border-box; height: 100%; padding: 45px 50px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                                    <!--<![endif]-->
                                                    <table id="u_content_heading_2" style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px;font-family:helvetica,sans-serif;" align="left">
                                                            <h1 class="v-font-size" style="margin: 0px; color: #0a0a0a; line-height: 120%; text-align: center; word-wrap: break-word; font-family: helvetica,sans-serif; font-size: 44px; font-weight: 700; ">Thanks for registering</h1>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table id="u_content_text_1" style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:40px 16px 25px;font-family:helvetica,sans-serif;" align="left">
                                                            <div class="v-font-size" style="font-size: 20px; color: #0a0a0a; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                              <p style="line-height: 140%;">Welcome to wrkload, the app that will help you keep track of what you have worked on in a simple and organized way.</p>
                                                              <p style="line-height: 140%;"> </p>
                                                              <p style="line-height: 140%; margin-top: 20px;">To start, please confirm your account</p>
                                                              <p style="line-height: 140%;">by clicking on the following button.</p>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table id="u_content_button_1" style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:20px 0px;font-family:helvetica,sans-serif;" align="left">
                                                            <!--[if mso]>
                                                            <style>.v-button {background: transparent !important;}</style>
                                                            <![endif]-->
                                                            <div align="center">
                                                              <!--[if mso]>
                                                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${frontendUrl}/confirm-account/${confirmationToken}" style="height:48px; v-text-anchor:middle; width:179px;" arcsize="8.5%"  stroke="f" fillcolor="#0a0a0a">
                                                                <w:anchorlock/>
                                                                <center style="color:#7686b7;font-family:helvetica,sans-serif;">
                                                                  <![endif]-->  
                                                                  <a href="${frontendUrl}/confirm-account/${confirmationToken}" target="_blank" class="v-button v-font-size" style="box-sizing: border-box;display: inline-block;font-family:helvetica,sans-serif;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #7686b7; background-color: #0a0a0a; border-radius: 50px;-webkit-border-radius: 50px; -moz-border-radius: 50px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;font-size: 18px;">
                                                                  <span class="v-padding" style="display:block;padding:14px 24px 12px;line-height:120%;"><span style="line-height: 21.6px;">Confirm account</span></span>
                                                                  </a>
                                                                  <!--[if mso]>
                                                                </center>
                                                              </v:roundrect>
                                                              <![endif]-->
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table id="u_content_text_1" style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 20px 25px;font-family:helvetica,sans-serif;" align="left">
                                                            <div class="v-font-size" style="font-size: 12px; color: #0a0a0a; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                              <p style="line-height: 140%;">The link is valid for 24 hours,</p>
                                                              <p style="line-height: 140%;">then you will have to <a rel="noopener" href="${frontendUrl}/resend-confirmation-account-link" target="_blank">request another one</a>.</p>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table id="u_content_text_3" style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px 0px 0px;font-family:helvetica,sans-serif;font-style: italic;" align="left">
                                                            <div class="v-font-size" style="font-size: 12px; color: #0a0a0a; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                              <p style="line-height: 140%;">;)</p>
                                                              <p style="line-height: 140%;">see you soon,</p>
                                                              <p style="line-height: 140%;"><a rel="noopener" href="https://kilimanjjjaro.com/" target="_blank">kilimanjjjaro</a></p>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <!--[if (!mso)&(!IE)]><!-->
                                                  </div>
                                                  <!--<![endif]-->
                                                </div>
                                              </div>
                                              <!--[if (mso)|(IE)]>
                                            </td>
                                            <![endif]-->
                                            <!--[if (mso)|(IE)]>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <![endif]-->
                                </div>
                              </div>
                            </div>
                            <div class="u-row-container" style="padding: 0px;background-color: transparent">
                              <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                  <!--[if (mso)|(IE)]>
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding: 0px;background-color: transparent;" align="center">
                                        <table cellpadding="0" cellspacing="0" border="0" style="width:500px;">
                                          <tr style="background-color: transparent;">
                                            <![endif]-->
                                            <!--[if (mso)|(IE)]>
                                            <td align="center" width="500" class="v-col-padding" style="width: 500px;padding: 20px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top">
                                              <![endif]-->
                                              <div class="u-col u-col-100" style="max-width: 320px;min-width: 500px;display: table-cell;vertical-align: top;">
                                                <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                                  <!--[if (!mso)&(!IE)]><!-->
                                                  <div class="v-col-padding" style="box-sizing: border-box; height: 100%; padding: 20px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                                    <!--<![endif]-->
                                                    <table style="font-family:helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:0px 30px;font-family:helvetica,sans-serif;font-size:12px;" align="left">
                                                            <div class="v-font-size" style="color: #7686b7; line-height: 140%; text-align: center; word-wrap: break-word;">
                                                              <p style="line-height: 140%;">© 2023 wrkload. All rights reserved.</p>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <!--[if (!mso)&(!IE)]><!-->
                                                  </div>
                                                  <!--<![endif]-->
                                                </div>
                                              </div>
                                              <!--[if (mso)|(IE)]>
                                            </td>
                                            <![endif]-->
                                            <!--[if (mso)|(IE)]>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <![endif]-->
                                </div>
                              </div>
                            </div>
                            <!--[if (mso)|(IE)]>
                          </td>
                        </tr>
                      </table>
                      <![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
              <!--[if mso]>
            </div>
            <![endif]-->
            <!--[if IE]>
          </div>
          <![endif]-->
        </body>
      </html>
  `
}
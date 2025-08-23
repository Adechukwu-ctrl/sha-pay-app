@echo off
echo Generating production keystore for Sha Pay...

"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair ^
  -v ^
  -keystore release.keystore ^
  -alias sha-pay-release ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000 ^
  -storepass ShaPay2024! ^
  -keypass ShaPay2024! ^
  -dname "CN=Sha Pay, OU=Mobile Development, O=Sha Pay Inc, L=Lagos, ST=Lagos, C=NG"

echo.
echo Keystore generated successfully!
echo Location: %cd%\release.keystore
echo Alias: sha-pay-release
echo Store Password: ShaPay2024!
echo Key Password: ShaPay2024!
echo.
echo IMPORTANT: Keep these credentials secure and backed up!
pause
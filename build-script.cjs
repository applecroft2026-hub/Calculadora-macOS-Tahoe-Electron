const https = require('https');
const fs = require('fs');

const { execSync } = require('child_process');
execSync('npm install --save-dev png-to-ico', { stdio: 'inherit' });
const pngToIco = require('png-to-ico');

const file = fs.createWriteStream("calc.png");
https.get("https://img.icons8.com/?size=1024&id=ujRmpOIupIsv&format=png&color=000000", function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(function() {
      console.log('Downloaded calc.png');
      pngToIco('calc.png')
        .then(buf => {
          fs.writeFileSync('Calculadora.ico', buf);
          console.log('Generated Calculadora.ico successfully.');
          
          // now run build
          console.log('Running build...');
          execSync('npm run build', { stdio: 'inherit' });
        })
        .catch(console.error);
    });
  });
});

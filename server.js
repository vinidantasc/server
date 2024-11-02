const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000; // Você pode mudar a porta se quiser

// Middleware para capturar o IP
app.use((req, res, next) => {
    // Captura do IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Para IPv6, pode ser necessário remover o prefixo "::ffff:" 
    const ipv4 = ip.includes('::ffff:') ? ip.replace('::ffff:', '') : ip;

    console.log(`IP Capturado: ${ipv4}`);
    
    // Salvar IP em um arquivo
    fs.appendFile('ips.txt', `${ipv4}\n`, (err) => {
        if (err) {
            console.error('Erro ao salvar o IP:', err);
        }
    });

    next();
});

// Rota principal
app.get('/', (req, res) => {
    res.send('Bem-vindo ao servidor! Seu IP foi capturado.');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

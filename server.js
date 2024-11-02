const express = require('express');
const fs = require('fs');
const axios = require('axios');
const useragent = require('useragent');
const app = express();
const port = 3000;

// Middleware para capturar informações do cliente
app.use(async (req, res, next) => {
    // Captura do IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipv4 = ip.includes('::ffff:') ? ip.replace('::ffff:', '') : ip;

    // Captura do User Agent
    const agent = useragent.parse(req.headers['user-agent']);
    const sistemaOperacional = agent.os.toString();
    const navegador = agent.toAgent();

    // Localização aproximada pelo IP
    let localizacao = 'Não disponível';
    let isp = 'Não disponível';
    try {
        const response = await axios.get(`https://ipinfo.io/${ipv4}/json`);
        localizacao = `${response.data.city}, ${response.data.region}, ${response.data.country}`;
        isp = response.data.org || 'ISP não disponível';
    } catch (error) {
        console.error('Erro ao obter a localização:', error.message);
    }

    // Captura o horário do acesso no horário de Brasília
    const horarioAcesso = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Salvar informações capturadas para exibir na resposta
    req.infoCapturada = {
        ip: ipv4,
        sistemaOperacional,
        navegador,
        localizacao,
        isp,
        horarioAcesso,
    };

    // Salvar informações em um arquivo
    const logData = `IP: ${ipv4}\nSistema Operacional: ${sistemaOperacional}\nNavegador: ${navegador}\nLocalização: ${localizacao}\nISP: ${isp}\nHorário do Acesso: ${horarioAcesso}\n\n`;
    fs.appendFile('logs.txt', logData, (err) => {
        if (err) {
            console.error('Erro ao salvar informações:', err);
        }
    });

    next();
});

// Rota principal para exibir informações capturadas
app.get('/', (req, res) => {
    const { ip, sistemaOperacional, navegador, localizacao, isp, horarioAcesso } = req.infoCapturada;
    res.send(`
        <html>
            <head>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #d3d3d3;
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                    }
                    .container h1 {
                        color: red;
                        font-size: 24px;
                        margin: 0;
                    }
                    .container p {
                        color: red;
                        font-size: 18px;
                        margin: 10px 0;
                    }
                    .warning {
                        color: black;  /* Cor da mensagem informativa em preto */
                        font-size: 16px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Informações Capturadas</h1>
                    <p><strong>IP:</strong> ${ip}</p>
                    <p><strong>Sistema Operacional:</strong> ${sistemaOperacional}</p>
                    <p><strong>Navegador:</strong> ${navegador}</p>
                    <p><strong>Localização Aproximada:</strong> ${localizacao}</p>
                    <p><strong>ISP:</strong> ${isp}</p>
                    <p><strong>Horário do Acesso:</strong> ${horarioAcesso}</p>
                    <p class="warning">Falsidade ideológica é crime, orientamos que procure a delegacia mais próxima ou aguarde a abordagem em sua residência.</p>
                </div>
            </body>
        </html>
    `);
});

// Inicializa o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

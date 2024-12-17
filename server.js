const express = require('express');
const fs = require('fs');
const axios = require('axios');
const useragent = require('useragent');

// Inicialização do app
const app = express();
const port = process.env.PORT || 3000; // Porta dinâmica para Render ou 3000 localmente

// Middleware para capturar informações do cliente
app.use(async (req, res, next) => {
    // Captura do IP (IPv4 ou IPv6)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Verifica se é um endereço IPv4 compatível com IPv6 (formato ::ffff:IPv4) e ajusta para IPv4 puro
    const ipv4 = ip.includes('::ffff:') ? ip.replace('::ffff:', '') : null;
    const ipv6 = ipv4 ? null : ip;  // Se for IPv4, ipv6 será null; se for IPv6, ipv6 recebe o IP original

    // Captura do User Agent
    const agent = useragent.parse(req.headers['user-agent']);
    const sistemaOperacional = agent.os.toString();
    const navegador = agent.toAgent();

    // Localização aproximada pelo IP
    let localizacao = 'Não disponível';
    let isp = 'Não disponível';
    try {
        const response = await axios.get(`https://ipinfo.io/${ipv4 || ipv6}/json`);
        localizacao = `${response.data.city}, ${response.data.region}, ${response.data.country}`;
        isp = response.data.org || 'ISP não disponível';
    } catch (error) {
        console.error('Erro ao obter a localização:', error.message);
    }

    // Captura o horário do acesso no horário de Brasília
    const horarioAcesso = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Salvar informações capturadas para exibir na resposta
    req.infoCapturada = {
        ipv4,
        localizacao,
        isp,
    };

    // Salvar todas as informações em um arquivo de log, incluindo IPv6, se disponível
    const logData = `IP: ${ipv4 || 'Não disponível'}\nIPv6: ${ipv6 || 'Não disponível'}\nSistema Operacional: ${sistemaOperacional}\nNavegador: ${navegador}\nLocalização: ${localizacao}\nISP: ${isp}\nHorário do Acesso: ${horarioAcesso}\n\n`;
    fs.appendFile('logs.txt', logData, (err) => {
        if (err) {
            console.error('Erro ao salvar informações:', err);
        }
    });

    next();
});

// Rota principal para exibir informações capturadas
app.get('/', (req, res) => {
    const { ipv4, localizacao, isp } = req.infoCapturada;
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
                    .isp-name {
                        color: blue;
                        font-weight: bold;
                    }
                    .warning {
                        color: black;
                        font-size: 16px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Informações Capturadas</h1>
                    <p><strong>IPv4:</strong> ${ipv4 || 'Não disponível'}</p>
                    <p><strong>Localização Aproximada:</strong> ${localizacao}</p>
                    <p><strong>ISP:</strong> <span class="isp-name">${isp}</span></p>
                    <p class="warning">Capturamos suas informações e estamos entrando em contato com seu provedor de internet <span class="isp-name">${isp}</span>.</p>
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

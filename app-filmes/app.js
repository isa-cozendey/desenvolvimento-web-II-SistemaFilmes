const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.use(session({ secret: 'segredo_filmes_ifc', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const filmes = [
    { 
        titulo: "Interestelar", 
        nota: 5, 
        img: "https://upload.wikimedia.org/wikipedia/pt/3/3a/Interstellar_Filme.png", 
        review: "Melhor filme sobre viagem no tempo!" 
    },
    { 
        titulo: "Matrix", 
        nota: 4, 
        img: "https://upload.wikimedia.org/wikipedia/pt/c/c1/The_Matrix_Poster.jpg", 
        review: "Um clássico absoluto da ficção científica." 
    },
    { 
        titulo: "Oppenheimer", 
        nota: 5, 
        img: "https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg", 
        review: "Atuação e direção impecáveis." 
    }
];

const layout = (content, user = null) => `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IFC Movies</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background-color: #f0f2f5; }
            .navbar { background-color: #004a2f; } /* Verde IFC */
            
            /* Novo estilo para o card de filme */
            .movie-card {
                border: none;
                border-radius: 12px;
                overflow: hidden;
                transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            }

            .movie-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
            }

            /* Estilo para a imagem: enquadra sem distorcer */
            .movie-card img {
                height: 400px;
                object-fit: contain; /* Enquadra a imagem inteira */
                background-color: #f8f9fa; /* Fundo cinza claro para preencher o vazio */
                border-bottom: 1px solid #eee;
                padding: 10px; /* Borda "passe-partout" */
            }

            .movie-card .card-body {
                padding: 1.25rem;
            }
        </style>
    </head>
    <body>
        <nav class="navbar navbar-dark mb-4">
            <div class="container">
                <a class="navbar-brand" href="/">🎬 IFC Movie Reviews</a>
                ${user ? `<div class="d-flex align-items-center text-white">
                            <span class="me-3">Olá, ${user.displayName}</span>
                            <img src="${user.photos[0].value}" width="35" class="rounded-circle me-3">
                            <a href="/logout" class="btn btn-outline-light btn-sm">Sair</a>
                          </div>` : ''}
            </div>
        </nav>
        <div class="container">${content}</div>
    </body>
    </html>
`;


app.get('/', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/dashboard');
    res.send(layout(`
        <div class="text-center py-5">
            <h1 class="display-4">Bem-vindo ao Avaliador de Filmes</h1>
            <p class="lead">Faça login com sua conta google para ver as avaliações.</p>
            <a href="/auth/google" class="btn btn-primary btn-lg px-5">Login com Google</a>
        </div>
    `));
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/dashboard')
);

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');

    const listaFilmesHtml = filmes.map(f => `
        <div class="col-md-4 mb-4">
            <div class="card movie-card shadow-sm">
                <img src="${f.img}" class="card-img-top">
                <div class="card-body">
                    <h5 class="card-title">${f.titulo}</h5>
                    <p class="text-warning mt-1">${"⭐".repeat(f.nota)}</p>
                    <p class="card-text text-muted">"${f.review}"</p>
                </div>
            </div>
        </div>
    `).join('');

    res.send(layout(`
        <h2 class="mb-4 text-center">Últimas Avaliações</h2>
        <div class="row">${listaFilmesHtml}</div>
    `, req.user));
});

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

app.listen(3000, () => console.log('App rodando em http://localhost:3000'));
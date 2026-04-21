const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// --- CONFIGURAÇÃO ---
app.use(session({ secret: 'segredo_filmes_ifc', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // Mantive a lógica simples para teste, mas você pode recolocar o if do @ifc.edu.br aqui
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- DADOS FICTÍCIOS (Simulando um Banco de Dados) ---
const filmes = [
    { titulo: "Interestelar", nota: 5, img: "https://image.tmdb.org/t/p/w500/nCbk9q2YvLMfwXvY79vovIsT9iR.jpg", review: "Melhor filme sobre viagem no tempo!" },
    { titulo: "Matrix", nota: 4, img: "https://image.tmdb.org/t/p/w500/f89U3Y9L7dbptvTMRccvUvSTBDs.jpg", review: "Um clássico absoluto da ficção científica." },
    { titulo: "Oppenheimer", nota: 5, img: "https://image.tmdb.org/t/p/w500/8GxvA9zDZUGPBwb93Z3fzWx9vCq.jpg", review: "Atuação e direção impecáveis." }
];

// --- TEMPLATE BASE (HTML/CSS) ---
const layout = (content, user = null) => `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IFC Movies</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background-color: #f8f9fa; }
            .navbar { background-color: #004a2f; } /* Verde IFC */
            .movie-card img { height: 400px; object-fit: cover; }
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

// --- ROTAS ---

app.get('/', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/dashboard');
    res.send(layout(`
        <div class="text-center py-5">
            <h1 class="display-4">Bem-vindo ao Avaliador de Filmes</h1>
            <p class="lead">Faça login com sua conta institucional para ver as avaliações.</p>
            <a href="/auth/google" class="btn btn-primary btn-lg px-5">Login com Google</a>
        </div>
    `));
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/dashboard')
);

// ÁREA PROTEGIDA REFORMULADA
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
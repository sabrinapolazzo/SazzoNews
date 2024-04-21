const express = require('express');
var mongoose = require('mongoose');
const path = require('path');
const app = express();

// to support JSON and URL-encoded bodies
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Basic Project Settings 
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));

// Connects to Collections
const Posts = require('./Posts.js');
const { error } = require('console');

mongoose.connect('mongodb+srv://sabrinapolazzo406:Anirbas1982.@cluster0.clmppxt.mongodb.net/sazzo_notices').then(function () {
    console.log('Conectado com sucesso');
}).catch(function (err) {
    console.log(err.message);
})

app.get('/', (req, res) => {
    if (req.query.busca == null) {
        // Busca todos os posts
        Posts.find({}).sort({ '_id': 1 }).exec()
            .then(posts => {
                posts = posts.map(function (val) {
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria
                    }
                });
                // Busca os posts mais vistos
                Posts.find({}).sort({ 'views': -1 }).limit(3).exec()
                    .then(postsTop => {
                        postsTop = postsTop.map(function (val) {
                            return {
                                titulo: val.titulo,
                                conteudo: val.conteudo,
                                descricaoCurta: val.conteudo.substr(0, 100),
                                imagem: val.imagem,
                                slug: val.slug,
                                categoria: val.categoria,
                                views: val.views
                            }
                        });
                        // Renderiza a página home com os posts e os posts mais vistos
                        res.render('home', { posts: posts, postsTop: postsTop });
                    })
                    .catch(error => {
                        console.log(error);
                        res.status(500).send('Erro interno no servidor.');
                    });
            })
            .catch(error => {
                console.log(error);
                res.status(500).send('Erro interno no servidor.');
            });
    } else {
        Posts.find({titulo: {$regex: req.query.busca, $options:"i"}})
        .then(postsBusca => {
            res.render('busca', {postsBusca:postsBusca,contagem:postsBusca.length});
        })
        .catch(error =>{
            console.log(error);
            res.status(500).send('Erro interno no servidor.');
        })
    }
});


app.get('/:slug', (req, res) => {
    Posts.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true })
        .then(noticia => {
            if (!noticia) {
                res.redirect('/');
            }
            // Busca os posts mais vistos
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec()
                .then(posts => {
                    const postsTop = posts.map(val => ({
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0, 100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views
                    }));
                    // Renderiza a página single com os detalhes do post encontrado e os posts mais vistos
                    res.render('single', { noticia: noticia, postsTop: postsTop });
                })
                .catch(error => {
                    console.log(error);
                    res.status(500).send('Erro interno no servidor.');
                });
        })
        .catch(error => {
            console.log(error);
            res.status(500).send('Erro interno no servidor.');
        });
});






app.listen(4000, () => {
    console.log('server running!');
})
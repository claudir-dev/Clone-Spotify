const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mysql = require('mysql2/promise')
const session = require('express-session')
const random = require('random')
const nodemailer = require('nodemailer')
require('dotenv').config()

const accountSid = process.env.TWILIO_SID
const authToken = process.env.TWILIO_TOKEN
const twilio = require('twilio')
const cliente = twilio(accountSid,authToken)

const servidor = express()
servidor.use(cors({
    origin: ['https://0496853d3209.ngrok-free.app','http://localhost:8888'],
    methods: ['GET', 'POST'],
    credentials: true  
}))
servidor.use(bodyParser.urlencoded({extended: false}))
servidor.use(bodyParser.json())
servidor.use(express.json())

servidor.use(session({
    secret: 'tanjiro',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
    }
}))

let pool 
let tokenSpotify = null
let token_tempo = null

async function IniarServidor() {
    try {
        pool = await mysql.createPool({
            host: process.env.host,
            user: process.env.user,
            password: process.env.password,
            database: process.env.database
        })

        console.log('conectado com sucesso ao banco de dados')

        servidor.post('/login/google', async (req,res) => {
            const {email} = req.body

            try {
                const [existe] = await pool.execute(`
                    SELECT * FROM usuarios WHERE email = ?
                    `, [email])

                if(existe.length > 0) {
                    res.json({message: 'usuario ja tem cadastro! Bem vidno de volta'})
                    console.log('usuario ja cadastrado')
                }  

                else {
                    await pool.execute(`
                        INSERT INTO usuarios (email) VALUES (?)
                        `,[email])
                    res.json({message: 'usuario cadastrado com sucesso'})    
                    console.log('usuario cadastrado com sucesso')
                }

            } catch (error){
                console.error('erro ao fazer login com o google')
                res.status(401).json({error: 'errro ao fazer login com google'})
            }     
        })
        servidor.post('/verificar/email', async (req,res) => {
            const {email} = req.body
            console.log('email recebido;', email)

            try {

                const [existe_email] = await pool.execute(`
                        SELECT * FROM usuarios WHERE email = ?
                    `, [email])

                if (existe_email.length > 0) {
                    res.status(500).json({error: 'Este endereço já está vinculado a uma conta existente.'})
                    console.log('este endereço ja esta vinculado a uma conta existente')
                } else {
                    res.json({message: 'este usuario ainda não tem conta conosco'})
                    console.log('este usuario ainda não tem conta conosco')
                }   

            } catch (error) {
                res.status(400).json({error: 'Error ao tentar verificar email no banco de dados'})
                console.error('Erro ao tentar verificar email no banco de dados')
            }     
        })
        servidor.post('/cadastra/usuario', async (req,res) => {
            const {email, senha} = req.body 

            try {
                await pool.execute(`
                    INSERT INTO usuarios (email ,senha) VALUES (?, ?) 
                    `, [email, senha])

                    res.json({message: 'Usuario cadastrado com sucesso'})
                    console.log('Usuario cadastrado com sucesso')

            } catch (error) {
                res.status(500).json({error: 'valha ao cadastra usuario'})
                console.error('error ao cadastrar usuario no banco de dados', error)
            }        
        })
        servidor.post('/verificar/usuario', async (req,res) => {
            const {valor_input} = req.body

            if (!valor_input) {
                res.status(404).json({error: 'variavel nem valor'})
                return
            }

            try {

                const [existe_usuario] = await pool.execute(`
                    SELECT * FROM usuarios WHERE  email = ?
                    `, [valor_input])
                    
                if(existe_usuario.length > 0) {
                    console.log('este usuario ja tem conta conosco')

                    const codigo = Math.floor(100000 + Math.random() * 900000)
                    req.session.sequencia = {
                        valor: codigo,
                        expira_em: Date.now() + 5 * 60 * 1000 
                    }
                    console.log('codigo salvo:',req.session.sequencia)

                    try {

                        const tranposte = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.email_user,
                                pass: process.env.email_pass
                            }
                        })

                        const config_email = {
                            from: process.env.email_user,
                            to: valor_input,
                            subject: 'código para entra na sua conta do Spotify' ,
                            text: `seu código é: ${req.session.sequencia.valor}\n este codigo tem duração de 5 minutos`
                        }

                        await tranposte.sendMail(config_email)
        
                        console.log('email enviado com sucesso')
                        return res.json({ message: 'Email enviado com sucesso' })

                    } catch (error) {
                        console.error('erro ao envair email para usuario', error)
                        res.status(401).json({error: 'Erro ao enviar email'})
                    }
                }    
                else {
                    res.status(500).json({error: 'O e-mail ou nome de usuário não está vinculado <br> a uma conta do Spotify'})
                    console.log('este usuario nao tem conta conosco')
                }
            } catch (error) {
                res.status(400).json({error: 'erro ao verifica a existencia do usuario no banco de dados'})
                console.log('erro ao verifica a existencia do usuario no banco de dados')
            }    
        })
   
        servidor.post('/Comparar/Codigo', async (req,res) => {
            try {
                console.log('sessão atual:', req.session)
                const codigo = req.session.sequencia
                console.log('codigo recebido da session', codigo?.valor)

                const {array} = req.body
                const codigoUsuario = array.join('').trim()
                console.log('codigo recebido do usuario:', array)

                if (!codigo || !codigo.valor || !codigo.expira_em) {
                    console.log('Código não encontrado na sessão')
                    return res.status(400).json({ error: 'Código não encontrado na sessão' });
            
                }

                const tempo_atual = Date.now()
                console.log('tempo atual:', tempo_atual)

                if(tempo_atual > codigo.expira_em) {
                    console.log('codigo expirado') 
                    return res.status(400).json({error: 'Codigo expirado!'})
                }
                if(parseInt(codigoUsuario) === codigo.valor) {
                    console.log('codigo valido!')
                    return res.json({message: 'codigo valido'})
                    
                } else {
                    console.log('codigo incorreto!')
                    return res.status(401).json({error: 'codigo incorreto!'})
                    
                }

            } catch (error) {
                console.log('erro',error)
                return res.status(401).json({error: 'erro na comparação dos codigos', error})
            }    
        })

        servidor.post('/codigo/telefone-sms', async (req,res) => {
            const {validaNUm} = req.body
            const telefone = validaNUm.number
            req.session.telefone = telefone 
            console.log('numero de telefone recebido:',req.session.telefone)

            const codigo_sms = Math.floor(100000 + Math.random() * 900000)
            req.session.sms = codigo_sms 
            console.log('codigo sms salvo:',req.session.sms)

            if(!telefone) {
                res.status(400).json({error: 'Parâmetro são obrigatórios'})
                console.log('numero nao enviado para servidor')
                return
            }

            try {
                const sms = await cliente.messages.create ({
                    body: `Código para conta no spotfy: ${req.session.sms}`,
                    from: '+18125754481',
                    to: req.session.telefone
                })

                res.json({success: true})
                console.log('sms enviado com sucesso')

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro ao enviar SMS.' });
            }

        })

        servidor.post('/verificar/codigo-sms', async (req,res) => {
            const {codigo_input} = req.body
            const usuario_sms = codigo_input
            console.log('codigo recebido do usuario:',usuario_sms)

            console.log('sessão atual:', req.session)
            const codigo_sms = req.session.sms
            console.log('codigo recebido da session',codigo_sms)

            const numero_usuario = req.session.telefone
            console.log('numero de telefone recebido da session:', numero_usuario)

            try {
                if(parseInt(usuario_sms) === codigo_sms) {
                    console.log('codigo sms validado com sucesso')

                    try {
                        const [existe] = await pool.execute(`
                                SELECT * FROM usuarios WHERE telefone = ?
                            `, [numero_usuario])

                        if(existe.length > 0) {
                            console.log('este numero ja esta cadastrado!') 
                            return res.json({message: 'este numero ja esta cadastrado!'})
                        } 
                        else {
                            await pool.execute(`
                                    INSERT INTO usuarios (telefone) VALUES (?)
                                `,[numero_usuario])
                            console.log('numero de telefone cadastrado com sucesso')
                        }

                        res.json({message: 'codigo validado com sucesso, cadastrado no banco de dados'})
                        console.log('codigo validado com sucesso, cadastrado no banco de dados')
                        return

                    } catch (error) {
                        res.status(500).json({error: 'erro ao tentar cadastrar numero de telefone'})
                        console.log('erro ao tentar cadastrar numero de telefone')
                    }   
                } 
                else {
                    res.status(400).json({error: 'codigo incorreto!'})
                    console.log('Codigo incorreto!')
                    return
                }
            } catch (error) {
                console.error('Erro ao tentar cadastrar número de telefone:', error);
                return res.status(500).json({ error: 'Erro ao tentar cadastrar número de telefone.' });
            }    
            
        })
        servidor.post('/verificar/email/senha', async (req,res) => {
            const {email, senha} = req.body
            console.log(`email recebido: ${email} || senha recebida: ${senha}`)

            try {

                const [verifica] = await pool.execute(`
                        SELECT * FROM usuarios WHERE email = ? AND senha = ?
                    `, [email,senha])
                
                if(verifica.length > 0) {
                    console.log('email e senha vailidos')
                    return res.json({message: 'email e senha validos'})
                } else {
                    console.log('email e senha invalido')
                    return res.status(400).json({error: 'email ou senha invalidos'})
                }
            }catch (error) {
                console.error('Erro ao tentar verificar email e senha no banco de dados')
                return res.status(500).json({message: 'Erro ao tentar verificar email e senha no banco de dados'})
            }    
        })

        servidor.post('/login/facebook', async (req, res) => {
            const { token, loginEmail } = req.body;

            if (!token) {
                console.log('Usuário cancelou ou negou a solicitação de login');
                return res.status(401).json({ error: 'Usuário cancelou ou negou a solicitação de login' });
            }

            try {
                const [verificaLoginFacebook] = await pool.execute(`
                    SELECT * FROM usuarios WHERE email = ?
                `, [loginEmail]);

                if (verificaLoginFacebook.length > 0) {
                    console.log('Este usuário já está cadastrado');
                    return res.json({ message: 'Usuário já tem cadastro' });
                } else {
                    await pool.execute(`
                        INSERT INTO usuarios (email) VALUES (?)
                    `, [loginEmail]);

                    console.log('Novo usuário cadastrado com sucesso');
                    return res.json({ message: 'Usuário cadastrado com sucesso' });
                }
            } catch (erro) {
                console.error('Erro ao processar login do Facebook:', erro);
                return res.status(500).json({ error: 'Erro no servidor' });
            }   
        });


    } catch (error) {
        console.error('error ao se conecta ao banco de dados')
        res.status(500).json({error: 'erro ao se conecta ao banco de dados'})
    }
}

const port = 5000
servidor.listen(port, ()=> {
    console.log('servidor criado com sucesso')
    console.log(`servidor rodando na porta ${port}`)
})

IniarServidor()



function logingoogle () {
    client = google.accounts.oauth2.initTokenClient({
        client_id: process.env.client_id,
        scope: 'https://www.googleapis.com/auth/userinfo.profile  https://www.googleapis.com/auth/userinfo.email ',
        callback: async (tokenResponse) => {
            console.log(tokenResponse)
            try {
                const response = await fetch ('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${tokenResponse.access_token}`
                    }
                })
                const user = await response.json()
                console.log(user)

                async function enviardados() {
                    try {
                        const email = user.email
                        const url = 'http://localhost:5000/login/google'

                        const enviar = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({email})
                        })
                        const resposta = await enviar.json()
                        console.log(resposta)

                        if (enviar.ok) {
                            location.href = 'home.html'
                        } else {
                            alert(resposta.error)
                        }
                    } catch (error) {
                        console.log('erro ao enviar dados para o servidor', error)
                        alert('erro ao envair dados para servidor')
                    }
                }
                enviardados()

            } catch (error) {;
                console.error('Errro ao buscar dados do usuario', error)
                alert('Erro no login com o google')
            }
        } 
    })    
    client.requestAccessToken()
}
function avanca () {
    const email = document.getElementById('email').value
    const erro = document.getElementById('erro')
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if(!regex.test(email)) {
        const border_input = document.getElementById('email')
        border_input.style.borderColor = 'red'
        erro.innerHTML = `Esse e-mail é invalido. O formato correto é 
        <br> assim: exemplo@email.com`
        const icone = document.createElement('i')
        icone.className = 'fa-solid fa-circle-exclamation'
        icone.style.marginTop = '-15px' 
        erro.appendChild(icone)
    } else {
        async function verificarEmailnoBanco() {
            try {

                const email = document.getElementById('email').value
                const url = 'http://localhost:5000/verificar/email'

                const enviar = await fetch (url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({email})
                })
                const dados = await enviar.json()
                console.log(dados)

                if(!enviar.ok) {
                    const border_input = document.getElementById('email')
                    border_input.style.borderColor = 'red'
                    const icone = document.createElement('i')
                    erro.innerHTML = `${dados.error}`
                    icone.className = 'fa-solid fa-circle-exclamation'
                    erro.appendChild(icone)
                    

                }
                else {
                    location.href = 'criar-senha.html'
                    localStorage.setItem('email', email)
                }
            } catch (error) {
                console.error('Error ao enviar para verificar no banco de dados', error)
            }    

        }
        verificarEmailnoBanco()
    }
    
}
function verSenha () {
    const senha = document.getElementById('senha')
    const icone = document.getElementById('icone-olho')
    const tipo = senha.getAttribute('type')

    if (tipo === 'password') {
        senha.setAttribute('type', 'text')
        icone.classList.remove('fa-eye')
        icone.classList.add('fa-eye-slash')
    } else {
        senha.setAttribute('type', 'password')
        icone.classList.remove('fa-eye-slash')
        icone.classList.add('fa-eye')
    }
}


const senha_input =  document.getElementById('senha')
senha_input.addEventListener('input', function () {
    const icone_circulo_num = document.getElementById('icone-circulo-num')
    const condicao_num = document.getElementById('condicao-num')
    const valor = senha_input.value
    const contemNUmero = /\d/.test(valor)

    const temLetra = /[a-zA-Z]/.test(valor)
    const icone_circulo_letra = document.getElementById('icone-circulo-letra')
    const condicao_letra = document.getElementById('condicao-letra')

    const icone_circulo_caracter = document.getElementById('icone-circulo-10')
    const condicao_caracter = document.getElementById('codicao-10')

    const btn = document.getElementById('btn')
    btn.disabled = false

    let erro = false

    if(!contemNUmero) {
        condicao_num.style.color = 'rgb(219, 45, 45)'
        icone_circulo_num.style.color = ''
        icone_circulo_num.style.backgroundColor = ''
        icone_circulo_num.style.fontSize = ''
        erro = true
        btn.disabled = true
        btn.style.cursor = 'no-drop'
        
    } else {
        condicao_num.style.color = ''
        icone_circulo_num.style.borderRadius = '30px'
        icone_circulo_num.style.fontSize = '17px'
        icone_circulo_num.style.color = 'rgb(21, 165, 21)'
        icone_circulo_num.style.backgroundColor = 'rgb(21, 165, 21)'
    }
    if (!temLetra) {
        condicao_letra.style.color = 'rgb(219, 45, 45)'
        icone_circulo_letra.style.color = ''
        icone_circulo_letra.style.backgroundColor = ''
        icone_circulo_letra.style.fontSize = ''
        btn.disabled = true
        btn.style.cursor = 'no-drop'
        erro = true
    } else {
        condicao_letra.style.color = ''
        icone_circulo_letra.style.borderRadius = '30px'
        icone_circulo_letra.style.fontSize = '17px'
        icone_circulo_letra.style.color = 'rgb(21, 165, 21)'
        icone_circulo_letra.style.backgroundColor = 'rgb(21, 165, 21)'
    }
    if (valor.length < 10) {
        condicao_caracter.style.color = 'rgb(219, 45, 45)'
        icone_circulo_caracter.style.color = ''
        icone_circulo_caracter.style.fontSize = ''
        icone_circulo_caracter.style.backgroundColor = ''
        erro = true 
        btn.disabled = true
        btn.style.cursor = 'no-drop'

    } else {
        condicao_caracter.style.color = ''
        icone_circulo_caracter.style.borderRadius = '30px'
        icone_circulo_caracter.style.fontSize = '17px'
        icone_circulo_caracter.style.color = 'rgb(21, 165, 21)'
        icone_circulo_caracter.style.backgroundColor = 'rgb(21, 165, 21)'
    }

    if (erro) {
        senha_input.style.borderColor = 'red'
    } else {
        senha_input.style.borderColor = 'white'
        btn.style.cursor = 'pointer'
    }


})

function login() {
        const email = localStorage.getItem('email')
        const senha = document.getElementById('senha').value
        

        const senha_input =  document.getElementById('senha')
        const condicao_num = document.getElementById('condicao-num')
        const condicao_letra = document.getElementById('condicao-letra')
        const condicao_caracter = document.getElementById('codicao-10')

        const contemNUmero = /\d/.test(senha)
        const temLetra = /[a-zA-Z]/.test(senha)
        const tamanhoMinimo = senha.length >= 10

        let valido = true
        


        if (!senha) {
            senha_input.style.borderColor = 'red'
            condicao_num.style.color = 'rgb(219, 45, 45)'
            condicao_letra.style.color = 'rgb(219, 45, 45)'
            condicao_caracter.style.color = 'rgb(219, 45, 45)'
            return
        } 

        if(!contemNUmero) {
            condicao_num.style.color = 'rgb(219, 45, 45)'
            valido = false
        }

        if(!temLetra) {
            condicao_letra.style.color = 'rgb(219, 45, 45)'
            valido = false
        }

        if(!tamanhoMinimo) {
            condicao_caracter.style.color = 'rgb(219, 45, 45)'
            valido = false
        }

        if(!valido) {
            senha_input.style.borderColor = 'red'
            return
        } 

        async function cadastraUsuario() {
            try {
                const dados = {
                    email: email,
                    senha: senha
                }

                const url = 'http://localhost:5000/cadastra/usuario'
                
                const envair = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dados)
                })

                const resposta_url = await  envair.json()
            
                if (envair.ok) {
                    location.href = 'home.html'
                } 
                else {
                    alert(resposta_url.error)
                }

            } catch (error) {
                console.error('erro ao enviar dados para o servidor',error)
                alert('Erro ao enviar dados para o servidor, estamos trabalho resolver isso!')
            }    
        }
        cadastraUsuario()
}

function continuar () {
    const valor_input = document.getElementById('input').value.trim()
    const erro = document.getElementById('erro')
    const border_input = document.getElementById('input')
    const btn_continuar = document.getElementById('btn-continuar')

    erro.innerHTML = ''

    if (!valor_input) {
        erro.innerHTML = `O e-mail ou nome de usuário não está vinculado <br> a uma conta do Spotify`
        const icone = document.createElement('i')
        icone.className = 'fa-solid fa-circle-exclamation'
        erro.appendChild(icone)

        border_input.style.borderColor = 'red'
        btn_continuar.style.cursor = 'no-drop'
        btn_continuar.style.opacity = '0.5'
    } else {
        border_input.style.borderColor = ''
        btn_continuar.style.cursor = 'pointer'
        btn_continuar.style.opacity = ''

        try {

            async function verificarUsuario() {
                const valor_input = document.getElementById('input').value.trim()
                const url = 'http://localhost:5000/verificar/usuario' 

                const enviar = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({valor_input}),
                    credentials: 'include'
                })

                const resposta_usuario = await enviar.json()

                if (enviar.ok) {
                    location.href = 'senha.html';
                    localStorage.setItem('email-usuario',valor_input)
                } else {
                    erro.innerHTML = `${resposta_usuario.error}`;
                    const icone = document.createElement('i');
                    icone.className = 'fa-solid fa-circle-exclamation';
                    erro.appendChild(icone);
                    border_input.style.borderColor = 'red';
                }
            }
            verificarUsuario()  

        } catch (error) {
            console.error('error ao enviar dados para a rota de verificação do usuario')
            alert('error ao enviar dados para a rota de verificação do usuario')
        }
          
    }
}
function loginAppe () {
    alert('Infelizmente a autenticação com a Apple é paga')
}






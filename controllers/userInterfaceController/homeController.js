exports.homepage = async(req, res) => {
    try {
        res.send('hello, homepage ni')
    } catch (err) {
        console.error('Error sa home route:', err)
        res.status(500).send('Internal server error')
    }
}

exports.aboutpage = async(req, res) => {
    console.log('Naa ka sa about waa ka')
    try {
        res.send('MAG UNSA MN KA DIRI')
    } catch (error) {
        console.log('Error kang waa ka')
        res.status(500).send('server error')

    }
}

exports.contactpage = async(req, res) => {
    console.log('Contact ni waa ka')
    try {
        res.send('WAKOY NUMBER KAHATAG')
    } catch (error) {
        console.log('error kang waa ka')
        res.status(500).send('server error')

    }
}
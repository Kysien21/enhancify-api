exports.HWT = async(req, res) => {
    try {
        res.send('How it works?')

    } catch (error) {
        console.log('error kang waa ka')
        res.status(500).send('Server Error')

    }
}

exports.price = async(req, res) => {
    try {
        res.send('Pricing')
    } catch (error) {
        console.log('Error kag waa ka')
        res.status(500).send('Server Error')
    }
}

exports.contacts = async(req, res) => {
    try {
        res.send('Contact us')
    } catch (error) {
        console.log('Error kang waa ka')
        res.status(500).send('Server Error')
    }
}
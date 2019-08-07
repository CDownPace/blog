class CookieControl {
    constructor() {
        this.tokenArr = []
    }
    // 获取
    getToken() {
        var token = ''
        var str = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
        for (var i = 0; i < 16; i++) {
            if(i % 5 == 0 && i != 0){


                token += '-'
            }
            token += str[parseInt(Math.random() * str.length)]
        }
        this.tokenArr.push(token)
        return token
    }
    // 检查
    checkToken(token) {
        for(var i = 0 ; i < this.tokenArr.length ; i++){
            if(this.tokenArr[i] == token){
                return true
            }
        }
        return false
    }
    // 删除
    removeToken(token) {
        for(var i = 0 ; i < this.tokenArr.length ; i++){
            if(this.tokenArr[i] == token){
                this.tokenArr.splice(i,1)
                return true
            }
        }
        return false
    }
}
module.exports = CookieControl
let nome: string = 'William'

let num: number; // primeiro coloca o nome da variavel depois tipa ela!!

console.log('Hello ${nome}');

function add(a:number,b:number):number{
    return a+b;
}

//int add (int a, int b)

const multiply = (a:number, b:number) => a*b

console.log(multiply(2,4))

console.log(add(1,1));

const person = {
    name: 'Alice',
    age: 20,
    greet: function(){
        console.log('Oi, eu sou $(this.name)')
    }
}

person.greet()

console.log('Nome : $(person.name), idade: $ (person.age)')

class Person{
    name : string
    age : number

    constructor(name: string, age:number){
        this.name = name
        this.age = age
    }
    greet(){
        console.log('Oi, eu sou $(this.name), idade $(this.age)')
    }

    haveBirthday(){
        this.age++
    }
}

const p1 = new Person('William', 25)

p1.greet()
p1.haveBirthday()

p1.greet()
export class RosettaNamedCollection<E> {

    readonly elements: E[] = [];
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }
    
}
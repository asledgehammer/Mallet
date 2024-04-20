export abstract class SerializableComponent<E> {

    serialize(): string {
        return JSON.stringify(this.onSave());
    }

    deserialize(json: string) {
        this.onLoad(JSON.parse(json));
    }

    abstract onSave(): object;
    abstract onLoad(o: object): void;
}

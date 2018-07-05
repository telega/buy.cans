import {Document} from 'mongoose';


export interface IToken{
	token: string,
	matched?: boolean,
	ignore?: boolean
}

export interface IArticle extends Document{
	frogs:string,
	sourceId:string,
	sourceName: string,
	title: string,
	url: string,
	publishedAt: Date,
	keyPhrases?: Array<string>,
	tokenizedTitle?:Array<IToken>,
	tokenCount?: number, 
	similarityScore?:number
}

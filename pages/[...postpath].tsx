import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const endpoint = process.env.GRAPHQL_ENDPOINT as string;
	const graphQLClient = new GraphQLClient(endpoint);
	const referringURL = ctx.req.headers?.referer || null;
	const pathArr = ctx.query.postpath as Array<string>;
	const path = pathArr.join('/');
	console.log(path);
	const fbclid = ctx.query.fbclid;

	// redirect if facebook is the referer or request contains fbclid
		if (referringURL?.includes('facebook.com') || fbclid) {

		return {
			redirect: {
				permanent: false,
				destination: `${
					`https://saveourstateok.org/` + encodeURI(path as string)
				}`,
			},
		};
		}
	const query = gql`
		{
			post(id: "/${path}/", idType: URI) {
				id
				excerpt
				title
				link
				dateGmt
				modifiedGmt
				content
				author {
					node {
						name
					}
				}
				featuredImage {
					node {
						sourceUrl
						altText
					}
				}
			}
		}
	`;

	const data = await graphQLClient.request(query);
	if (!data.post) {
		return {
			notFound: true,
		};
	}
	return {
		props: {
			path,
			post: data.post,
			host: ctx.req.headers.host,
		},
	};
};

interface PostProps {
	post: any;
	host: string;
	path: string;
}

const Post: React.FC<PostProps> = (props) => {
	const { post, host, path } = props;

	// to remove tags from excerpt
	const removeTags = (str: string) => {
		if (str === null || str === '') return '';
		else str = str.toString();
		return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
	};

	return (
		<>
			<Head>
				<meta property="og:image" content={post.featuredImage.node.sourceUrl} />
				
				
				<title>{post.title}</title>
			</Head>
			<div className="post-container">
				<h1>{post.title}</h1>
				<img
					src={post.featuredImage.node.sourceUrl}
					alt={post.featuredImage.node.altText || post.title}
				/>
				<article dangerouslySetInnerHTML={{ __html: post.content }} />
			</div>
		</>
	);
};

export default Post;
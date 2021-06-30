import { Suspense } from 'react';

import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  const getReadingTime = blocks => {
    const wordsPerMinute = 180;

    const allText = blocks.reduce((acc, content) => {
      const text = content.body.map(body => {
        return body.text;
      });

      acc.texto = text;

      return acc;
    });

    let reading_time = '1 min';
    const textLength = allText.texto.join().split(' ').length; // Split by words

    if (textLength > 0) {
      const value = Math.ceil(textLength / wordsPerMinute);
      reading_time = `${value} min`;
    }

    return reading_time;
  };

  return (
    <>
      <Head>
        <title>{post.data.title} | Ignews</title>
      </Head>
      {isFallback && <div>Carregando...</div>}
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfos}>
            <time>
              <img src="/images/calendar.svg" alt="Data da publicação" />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <span className={styles.author}>
              <img src="/images/user.svg" alt="Autor" />
              {post.data.author}
            </span>
            <span className={styles.clock}>
              <img src="/images/clock.svg" alt="Tempo" />
              {getReadingTime(post.data.content)}
            </span>
          </div>

          <div className={`${styles.postContent}`}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h4>{content.heading}</h4>
                {content.body.map(body => (
                  <p key={body.text}>{body.text}</p>
                ))}
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    paths: [
      {
        params: {
          slug: 'como-utilizar-hooks',
        },
      },
      {
        params: {
          slug: 'criando-um-app-cra-do-zero',
        },
      },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { params } = context;
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(c => {
        return {
          heading: c.heading,
          body: c.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30,
  };
};

import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';

import { getPrismicClient } from '../services/prismic';

import { MorePosts } from '../components/MorePosts';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [showMorePosts, setShowMorePosts] = useState(
    !!postsPagination.next_page
  );

  const formatDate = (date: string): string => {
    const dateFormatted = format(new Date(date), 'dd MMM yyyy', {
      locale: ptBR,
    });

    return dateFormatted;
  };

  const loadMorePosts = async (next_page): Promise<void> => {
    const newPosts = await axios.get(next_page);
    const { data } = newPosts;

    setShowMorePosts(!!data.next_page);

    setPosts([...postsPagination.results, ...data.results]);
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts &&
            posts.map(post => (
              <Link href={`post/${post.uid}`} key={post.uid}>
                <a key={post.uid}>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <time>
                      <img
                        src="/images/calendar.svg"
                        alt="Data da publicação"
                      />
                      {formatDate(post.first_publication_date)}
                    </time>
                    <span>
                      <img src="/images/user.svg" alt="Autor" />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          {showMorePosts && (
            <MorePosts
              onClick={() => loadMorePosts(postsPagination.next_page)}
            />
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results,
      },
    },
  };
};
